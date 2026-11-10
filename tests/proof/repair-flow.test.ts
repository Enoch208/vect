import { describe, expect, it } from "vitest";
import type {
  RepairAttempt,
  RepairRequest,
  RepairResponse,
} from "../../src/contract/api.schema.js";
import type { WorldPatch } from "../../src/contract/patch.schema.js";
import type { VerificationReport } from "../../src/contract/report.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { proposeRuleRepair } from "../../src/agents/rule-repair.js";
import { handleTestRequest } from "../../src/agents/test-protocol.js";
import { connectTestRun, type TestRunHandle } from "../../src/agents/test-session.js";
import { applyPatch } from "../../src/domain/apply-patch.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import type { ApiResult } from "../../src/store/api-client.js";
import { runRepairFlow, type RepairPhase } from "../../src/store/repair-flow.js";
import type { WorldVersion } from "../../src/store/types.js";
import { verifyWorld } from "../../src/verification/verify.js";

const isoNow = () => "2026-11-10T23:00:00.000Z";
const clock = { now: () => 0, isoNow };

const broken: WorldVersion = {
  id: "draft",
  world: observatoryKeyBehindDoor,
  revisionHash: worldRevisionHash(observatoryKeyBehindDoor),
  source: "edited",
  origin: "live_ai",
  modelId: "test-model",
  parentHash: null,
  patch: null,
  instruction: "put the key in the room it unlocks",
  createdAt: isoNow(),
};

const failedReport = verifyWorld(broken.world, { seed: broken.world.seed, ...clock });

function rulePatch(): WorldPatch {
  const finding = failedReport.findings[0];
  if (finding === undefined) throw new Error("the twin has no finding");
  const patch = proposeRuleRepair(broken.world, finding);
  if (patch === null) throw new Error("no rule repair");
  return patch;
}

function candidateOf(patch: WorldPatch): WorldSpec {
  const applied = applyPatch(broken.world, patch);
  if (!applied.ok) throw new Error(applied.reason);
  return applied.candidate;
}

function accepted(patch: WorldPatch, candidate: WorldSpec): RepairAttempt {
  return {
    attempt: 1,
    mode: "deterministic_rule",
    patch,
    candidateRevisionHash: worldRevisionHash(candidate),
    outcome: "ACCEPTED_FOR_VERIFICATION",
    reason: "Moves the key to a room reachable before its door.",
  };
}

function apiReturning(result: ApiResult<RepairResponse>, seen: RepairRequest[] = []) {
  return {
    repair: (request: RepairRequest) => {
      seen.push(request);
      return Promise.resolve(result);
    },
  };
}

function responseWith(candidate: WorldSpec | null, attempts: RepairAttempt[]): RepairResponse {
  return {
    requestId: "req-1",
    modelId: null,
    baseRevisionHash: broken.revisionHash,
    attempts,
    candidate,
    candidateRevisionHash: candidate === null ? null : worldRevisionHash(candidate),
    durationMs: 5,
  };
}

function realRunner(calls: string[] = []) {
  return (world: WorldSpec, seed: number): TestRunHandle => {
    calls.push(worldRevisionHash(world));
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
  };
}

function cannedRunner(report: (world: WorldSpec, seed: number) => VerificationReport) {
  return (world: WorldSpec, seed: number): TestRunHandle => ({
    onStep: () => () => undefined,
    done: Promise.resolve(report(world, seed)),
    cancel: () => undefined,
  });
}

describe("runRepairFlow", () => {
  it("a verified candidate is committed as repaired", async () => {
    const patch = rulePatch();
    const candidate = candidateOf(patch);
    const seen: RepairRequest[] = [];
    const phases: RepairPhase[] = [];
    const result = await runRepairFlow({
      api: apiReturning(
        { ok: true, data: responseWith(candidate, [accepted(patch, candidate)]) },
        seen,
      ),
      startTestRun: realRunner(),
      version: broken,
      report: failedReport,
      isoNow,
      onPhase: (phase) => phases.push(phase),
    });
    expect(seen[0]?.finding.code).toBe("CIRCULAR_DEPENDENCY");
    expect(seen[0]?.maxAttempts).toBe(3);
    expect(seen[0]?.baseRevisionHash).toBe(broken.revisionHash);
    expect(result.outcome).toBe("VERIFIED_REPAIR");
    expect(result.candidateReport?.status).toBe("VERIFIED");
    expect(result.candidate?.source).toBe("repaired");
    expect(result.candidate?.origin).toBe("deterministic_rule");
    expect(result.candidate?.parentHash).toBe(broken.revisionHash);
    expect(result.candidate?.patch).toEqual(patch);
    expect(result.candidate?.revisionHash).toBe(worldRevisionHash(candidate));
    expect(result.candidate?.revisionHash).not.toBe(broken.revisionHash);
    expect(phases).toEqual(["proposing", "screening", "fresh-run", "replay"]);
  });

  it("an inconclusive candidate is not committed", async () => {
    const patch = rulePatch();
    const candidate = candidateOf(patch);
    const result = await runRepairFlow({
      api: apiReturning({ ok: true, data: responseWith(candidate, [accepted(patch, candidate)]) }),
      startTestRun: cannedRunner((world, seed) =>
        verifyWorld(world, { seed, ...clock, maxSteps: 2 }),
      ),
      version: broken,
      report: failedReport,
      isoNow,
    });
    expect(result.outcome).toBe("UNVERIFIED_REPAIR");
    expect(result.candidate).toBeNull();
    expect(result.candidateReport?.status).toBe("INCONCLUSIVE");
  });

  it("a tampered VERIFIED report from the runner is not committed", async () => {
    const patch = rulePatch();
    const candidate = candidateOf(patch);
    const result = await runRepairFlow({
      api: apiReturning({ ok: true, data: responseWith(candidate, [accepted(patch, candidate)]) }),
      startTestRun: cannedRunner((world, seed) => ({
        ...verifyWorld(world, { seed, ...clock, maxSteps: 2 }),
        status: "VERIFIED",
      })),
      version: broken,
      report: failedReport,
      isoNow,
    });
    expect(result.outcome).toBe("UNVERIFIED_REPAIR");
    expect(result.candidate).toBeNull();
  });

  it("no candidate gives NO_CANDIDATE and the original stays active", async () => {
    const before = structuredClone(broken);
    const rejected: RepairAttempt[] = [1, 2, 3].map((attempt) => ({
      attempt,
      mode: "live_ai",
      patch: null,
      candidateRevisionHash: null,
      outcome: "REJECTED_INTENT_BREAKING",
      reason: `Attempt ${String(attempt)} removed the goal.`,
    }));
    const calls: string[] = [];
    const result = await runRepairFlow({
      api: apiReturning({ ok: true, data: responseWith(null, rejected) }),
      startTestRun: realRunner(calls),
      version: broken,
      report: failedReport,
      isoNow,
    });
    expect(result.outcome).toBe("NO_CANDIDATE");
    expect(result.attempts).toHaveLength(3);
    expect(result.candidate).toBeNull();
    expect(calls).toEqual([]);
    expect(broken).toEqual(before);
  });

  it("a candidate that does not match its own patch is never run", async () => {
    const patch = rulePatch();
    const calls: string[] = [];
    const result = await runRepairFlow({
      api: apiReturning({
        ok: true,
        data: responseWith(observatoryKeyBehindDoor, [accepted(patch, candidateOf(patch))]),
      }),
      startTestRun: realRunner(calls),
      version: broken,
      report: failedReport,
      isoNow,
    });
    expect(result.outcome).toBe("UNVERIFIED_REPAIR");
    expect(calls).toEqual([]);
    expect(result.reason).not.toBeNull();
  });

  it("a failed request gives FAILED_REQUEST with the client failure", async () => {
    const result = await runRepairFlow({
      api: apiReturning({
        ok: false,
        failure: {
          code: "PROVIDER_TIMEOUT",
          message: "The model took too long.",
          retryable: true,
          suggestion: null,
          status: 504,
        },
      }),
      startTestRun: realRunner(),
      version: broken,
      report: failedReport,
      isoNow,
    });
    expect(result.outcome).toBe("FAILED_REQUEST");
    expect(result.failure?.code).toBe("PROVIDER_TIMEOUT");
  });
});
