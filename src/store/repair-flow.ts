import type { RepairAttempt, RepairRequest, RepairResponse } from "../contract/api.schema.js";
import { repairAllowedOperations, type WorldPatch } from "../contract/patch.schema.js";
import type { VerificationReport } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import type { StepListener } from "../agents/test-session.js";
import { applyPatch } from "../domain/apply-patch.js";
import { worldRevisionHash } from "../domain/canonical.js";
import { intentViolations } from "../verification/intent.js";
import { reportStatusFor } from "../verification/report.js";
import type { ApiResult, ClientFailure } from "./api-client.js";
import type { TestRunner } from "./test-store.js";
import type { WorldVersion } from "./types.js";

export type RepairPhase = "proposing" | "screening" | "fresh-run" | "replay";

export type RepairFlowOutcome =
  "VERIFIED_REPAIR" | "UNVERIFIED_REPAIR" | "NO_CANDIDATE" | "FAILED_REQUEST";

export type RepairFlowResult = {
  attempts: RepairAttempt[];
  candidate: WorldVersion | null;
  candidateReport: VerificationReport | null;
  outcome: RepairFlowOutcome;
  reason: string | null;
  failure: ClientFailure | null;
};

export type RepairFlowDeps = {
  api: { repair: (request: RepairRequest) => Promise<ApiResult<RepairResponse>> };
  startTestRun: TestRunner;
  version: WorldVersion;
  report: VerificationReport;
  isoNow: () => string;
  onPhase?: (phase: RepairPhase) => void;
  onStep?: StepListener;
};

type Screened =
  | {
      ok: true;
      candidate: WorldSpec;
      revisionHash: string;
      attempt: RepairAttempt;
      patch: WorldPatch;
    }
  | { ok: false; reason: string };

const allowed: readonly string[] = repairAllowedOperations;

function screen(version: WorldVersion, response: RepairResponse, candidate: WorldSpec): Screened {
  const revisionHash = worldRevisionHash(candidate);
  if (response.baseRevisionHash !== version.revisionHash) {
    return { ok: false, reason: "The repair was made for a different revision of this world." };
  }
  if (revisionHash !== response.candidateRevisionHash) {
    return {
      ok: false,
      reason: "The candidate's revision hash does not match the world sent with it.",
    };
  }
  const attempt = response.attempts.find(
    (item) =>
      item.outcome === "ACCEPTED_FOR_VERIFICATION" && item.candidateRevisionHash === revisionHash,
  );
  const patch = attempt?.patch ?? null;
  if (attempt === undefined || patch === null) {
    return { ok: false, reason: "No accepted repair attempt produced this candidate." };
  }
  if (!patch.operations.every((item) => allowed.includes(item.op))) {
    return { ok: false, reason: "The repair uses an operation that repairs may not use." };
  }
  const applied = applyPatch(version.world, patch);
  if (!applied.ok || applied.revisionHash !== revisionHash) {
    return { ok: false, reason: "The candidate is not what its patch produces on this revision." };
  }
  const [violation] = intentViolations(version.world, applied.candidate);
  if (violation !== undefined) {
    return { ok: false, reason: `The candidate does not keep the objective. ${violation}` };
  }
  return { ok: true, candidate: applied.candidate, revisionHash, attempt, patch };
}

function repairedVersion(
  deps: RepairFlowDeps,
  response: RepairResponse,
  screened: Extract<Screened, { ok: true }>,
): WorldVersion {
  return {
    id: `repaired-${screened.revisionHash.slice(0, 12)}`,
    world: screened.candidate,
    revisionHash: screened.revisionHash,
    source: "repaired",
    origin: screened.attempt.mode,
    modelId: screened.attempt.mode === "live_ai" ? response.modelId : null,
    parentHash: deps.version.revisionHash,
    patch: screened.patch,
    instruction: screened.patch.intent,
    createdAt: deps.isoNow(),
  };
}

const nothing = {
  attempts: [],
  candidate: null,
  candidateReport: null,
  reason: null,
  failure: null,
};

export async function runRepairFlow(deps: RepairFlowDeps): Promise<RepairFlowResult> {
  const finding = deps.report.findings[0];
  if (finding === undefined) {
    return { ...nothing, outcome: "NO_CANDIDATE", reason: "The report has no finding to repair." };
  }
  deps.onPhase?.("proposing");
  const response = await deps.api.repair({
    world: deps.version.world,
    baseRevisionHash: deps.version.revisionHash,
    finding: { code: finding.code, entityIds: finding.entityIds, explanation: finding.explanation },
    maxAttempts: 3,
  });
  if (!response.ok) {
    return {
      ...nothing,
      outcome: "FAILED_REQUEST",
      failure: response.failure,
      reason: response.failure.message,
    };
  }
  const { attempts, candidate } = response.data;
  if (candidate === null) {
    const reason = "No repair attempt kept the objective and passed the solver.";
    return { ...nothing, attempts, outcome: "NO_CANDIDATE", reason };
  }
  deps.onPhase?.("screening");
  const screened = screen(deps.version, response.data, candidate);
  if (!screened.ok)
    return { ...nothing, attempts, outcome: "UNVERIFIED_REPAIR", reason: screened.reason };
  deps.onPhase?.("fresh-run");
  const handle = deps.startTestRun(screened.candidate, deps.report.initialSeed);
  if (deps.onStep !== undefined) handle.onStep(deps.onStep);
  const candidateReport = await handle.done;
  deps.onPhase?.("replay");
  const status = reportStatusFor(screened.candidate, candidateReport);
  if (status !== "VERIFIED") {
    const reason = `The fresh run on the candidate ended ${status}, so the repair was not committed.`;
    return { ...nothing, attempts, candidateReport, outcome: "UNVERIFIED_REPAIR", reason };
  }
  return {
    attempts,
    candidate: repairedVersion(deps, response.data, screened),
    candidateReport,
    outcome: "VERIFIED_REPAIR",
    reason: null,
    failure: null,
  };
}
