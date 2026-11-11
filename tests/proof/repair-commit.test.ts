import { beforeEach, describe, expect, it } from "vitest";
import type { RepairResponse } from "../../src/contract/api.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { proposeRuleRepair } from "../../src/agents/rule-repair.js";
import { handleTestRequest } from "../../src/agents/test-protocol.js";
import { connectTestRun, type TestRunHandle } from "../../src/agents/test-session.js";
import { applyPatch } from "../../src/domain/apply-patch.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { useProjectStore } from "../../src/store/project-store.js";
import { commitRepair, runRepairFlow, type RepairFlowResult } from "../../src/store/repair-flow.js";
import type { WorldVersion } from "../../src/store/types.js";
import { verifyWorld } from "../../src/verification/verify.js";

const isoNow = () => "2026-11-11T01:00:00.000Z";
const clock = { now: () => 0, isoNow };

const draft: WorldVersion = {
  id: "draft",
  world: observatoryKeyBehindDoor,
  revisionHash: worldRevisionHash(observatoryKeyBehindDoor),
  source: "edited",
  origin: "live_ai",
  modelId: null,
  parentHash: null,
  patch: null,
  instruction: "put the key in the room it unlocks",
  createdAt: isoNow(),
};
const failed = verifyWorld(draft.world, { seed: draft.world.seed, ...clock });

function runner(world: WorldSpec, seed: number): TestRunHandle {
  let deliver: (message: unknown) => void = () => undefined;
  return connectTestRun(
    {
      send: (request) => {
        queueMicrotask(() => {
          handleTestRequest(
            request,
            (message) => {
              deliver(message);
            },
            clock,
          );
        });
      },
      listen: (onMessage) => {
        deliver = onMessage;
      },
      close: () => {
        deliver = () => undefined;
      },
    },
    world,
    seed,
    clock,
  );
}

function repairApi() {
  const finding = failed.findings[0];
  const patch = finding === undefined ? null : proposeRuleRepair(draft.world, finding);
  if (patch === null) throw new Error("no rule repair");
  const applied = applyPatch(draft.world, patch);
  if (!applied.ok) throw new Error(applied.reason);
  const response: RepairResponse = {
    requestId: "r",
    modelId: null,
    baseRevisionHash: draft.revisionHash,
    attempts: [
      {
        attempt: 1,
        mode: "deterministic_rule",
        patch,
        candidateRevisionHash: applied.revisionHash,
        outcome: "ACCEPTED_FOR_VERIFICATION",
        reason: "ok",
      },
    ],
    candidate: applied.candidate,
    candidateRevisionHash: applied.revisionHash,
    durationMs: 1,
  };
  return { repair: () => Promise.resolve({ ok: true as const, data: response }) };
}

async function verifiedResult(): Promise<RepairFlowResult> {
  const result = await runRepairFlow({
    api: repairApi(),
    startTestRun: runner,
    version: draft,
    report: failed,
    isoNow,
  });
  expect(result.outcome).toBe("VERIFIED_REPAIR");
  return result;
}

const studioHandler = (committed: WorldVersion) => {
  useProjectStore.getState().addVersion(committed);
};

beforeEach(() => {
  useProjectStore.setState({ versions: [], activeId: null, reports: {} });
  useProjectStore.getState().addVersion(draft);
});

describe("commitRepair", () => {
  it("a click as soon as Commit appears activates the repaired version with its report", async () => {
    const result = await verifiedResult();
    const committed = commitRepair(result, studioHandler);
    const project = useProjectStore.getState();
    expect(committed?.revisionHash).toBe(result.candidate?.revisionHash);
    expect(project.active()?.revisionHash).toBe(result.candidate?.revisionHash);
    expect(project.reports[result.candidate?.revisionHash ?? ""]?.status).toBe("VERIFIED");
  });

  it("selects a repaired revision that already exists instead of doing nothing", async () => {
    const result = await verifiedResult();
    if (result.candidate === null) throw new Error("no candidate");
    useProjectStore
      .getState()
      .addVersion({ ...result.candidate, createdAt: "2026-11-10T20:00:00.000Z" });
    useProjectStore.getState().select("draft");
    commitRepair(result, studioHandler);
    const project = useProjectStore.getState();
    expect(project.active()?.revisionHash).toBe(result.candidate.revisionHash);
    expect(
      project.versions.filter((item) => item.revisionHash === result.candidate?.revisionHash),
    ).toHaveLength(1);
  });

  it("a second click is harmless", async () => {
    const result = await verifiedResult();
    commitRepair(result, studioHandler);
    commitRepair(result, studioHandler);
    const project = useProjectStore.getState();
    expect(project.versions).toHaveLength(2);
    expect(project.active()?.revisionHash).toBe(result.candidate?.revisionHash);
  });

  it("an unverified result commits nothing", async () => {
    const result = await verifiedResult();
    const calls: WorldVersion[] = [];
    const unverified: RepairFlowResult = {
      ...result,
      outcome: "UNVERIFIED_REPAIR",
      candidate: null,
    };
    expect(commitRepair(unverified, (item) => calls.push(item))).toBeNull();
    const forged: RepairFlowResult = {
      ...result,
      candidateReport:
        result.candidateReport === null ? null : { ...result.candidateReport, initialSeed: 1 },
    };
    expect(commitRepair(forged, (item) => calls.push(item))).toBeNull();
    expect(calls).toEqual([]);
    expect(useProjectStore.getState().active()?.id).toBe("draft");
  });
});
