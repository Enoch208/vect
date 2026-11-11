import { describe, expect, it } from "vitest";
import type { RepairResponse } from "../../src/contract/api.schema.js";
import type { VerificationReport } from "../../src/contract/report.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { proposeRuleRepair } from "../../src/agents/rule-repair.js";
import { handleTestRequest } from "../../src/agents/test-protocol.js";
import { connectTestRun, type TestRunHandle } from "../../src/agents/test-session.js";
import { applyPatch } from "../../src/domain/apply-patch.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { runRepairFlow, type RepairPhase } from "../../src/store/repair-flow.js";
import { createTestStore, type TestStoreDeps } from "../../src/store/test-store.js";
import type { WorldVersion } from "../../src/store/types.js";
import { verifyReportIntegrity } from "../../src/verification/report.js";
import { verifyWorld } from "../../src/verification/verify.js";

const isoNow = () => "2026-11-11T01:30:00.000Z";
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
  instruction: "",
  createdAt: isoNow(),
};
const failed = verifyWorld(draft.world, { seed: draft.world.seed, ...clock });
const finding = failed.findings[0];
const patch = finding === undefined ? null : proposeRuleRepair(draft.world, finding);
if (patch === null) throw new Error("no rule repair");
const applied = applyPatch(draft.world, patch);
if (!applied.ok) throw new Error(applied.reason);
const candidate = applied.candidate;

function workerRunner(world: WorldSpec, seed: number): TestRunHandle {
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

function pacedStore() {
  const ticker: { tick: () => void } = { tick: () => undefined };
  const recorded: VerificationReport[] = [];
  const deps: TestStoreDeps = {
    every: (_ms, tick) => {
      ticker.tick = tick;
      return () => {
        ticker.tick = () => undefined;
      };
    },
    reducedMotion: () => false,
    onReport: (report) => recorded.push(report),
    isoNow,
  };
  return { store: createTestStore(deps), ticker, recorded };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 6; i++) await Promise.resolve();
}

describe("a tracked run", () => {
  it("resolves only after playback has caught up, and drives a viewport on its own world", async () => {
    const { store, ticker, recorded } = pacedStore();
    let resolved: VerificationReport | null = null;
    const handle = store.getState().track(candidate, candidate.seed, workerRunner);
    void handle.done.then((report) => {
      resolved = report;
    });
    await settle();
    const total = store.getState().run?.steps.length ?? 0;
    expect(total).toBeGreaterThan(1);
    expect(resolved).toBeNull();
    const start = store.getState().viewport();
    expect(start?.world).toBe(candidate);
    expect(start?.revisionHash).toBe(worldRevisionHash(candidate));
    expect(start?.path).toHaveLength(1);
    for (let i = 0; i < total; i++) ticker.tick();
    await settle();
    expect(resolved).not.toBeNull();
    expect(store.getState().viewport()?.state.won).toBe(true);
    expect(store.getState().viewport()?.path).toHaveLength(total + 1);
    expect(recorded.map((report) => report.status)).toEqual(["VERIFIED"]);
  });

  it("resolves CANCELLED when cancelled or replaced, with a report that passes its own digest", async () => {
    const { store } = pacedStore();
    const first = store.getState().track(candidate, candidate.seed, workerRunner);
    store.getState().cancel();
    const cancelled = await first.done;
    expect(cancelled.status).toBe("CANCELLED");
    expect(verifyReportIntegrity(cancelled)).toBe(true);
    const second = store.getState().track(candidate, candidate.seed, workerRunner);
    store.getState().track(candidate, candidate.seed, workerRunner);
    expect((await second.done).status).toBe("CANCELLED");
  });

  it("lets the repair flow's fresh run be watched step by step before the verdict", async () => {
    const { store, ticker } = pacedStore();
    const phases: RepairPhase[] = [];
    const response: RepairResponse = {
      requestId: "r",
      modelId: null,
      baseRevisionHash: draft.revisionHash,
      attempts: [
        {
          attempt: 1,
          mode: "deterministic_rule",
          patch,
          candidateRevisionHash: worldRevisionHash(candidate),
          outcome: "ACCEPTED_FOR_VERIFICATION",
          reason: "ok",
        },
      ],
      candidate,
      candidateRevisionHash: worldRevisionHash(candidate),
      durationMs: 1,
    };
    const flow = runRepairFlow({
      api: { repair: () => Promise.resolve({ ok: true as const, data: response }) },
      startTestRun: (world, seed) => store.getState().track(world, seed, workerRunner),
      version: draft,
      report: failed,
      isoNow,
      onPhase: (phase) => phases.push(phase),
    });
    await settle();
    expect(phases.at(-1)).toBe("fresh-run");
    const total = store.getState().run?.steps.length ?? 0;
    for (let i = 0; i < total; i++) ticker.tick();
    const result = await flow;
    expect(result.outcome).toBe("VERIFIED_REPAIR");
    expect(phases).toEqual(["proposing", "screening", "fresh-run", "replay"]);
  });
});
