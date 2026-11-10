import type { GameState } from "../contract/game.schema.js";
import { idSchema } from "../contract/expr.schema.js";
import type { Assertion, TraceStep, VerificationReport } from "../contract/report.schema.js";
import { worldSpecSchema, type WorldSpec } from "../contract/world.schema.js";
import { runPlaytest, type PlaytestOptions } from "../agents/playtest.js";
import { sha256Hex, worldRevisionHash } from "../domain/canonical.js";
import { assertInvariants } from "../domain/invariants.js";
import { buildReport } from "./report.js";
import { replayStates, type Replay } from "./replay.js";
import { solve } from "./solve.js";
import { validateWorld } from "./validate-world.js";
import { assertionsOf, verdictOf, type Evidence, type Verdict } from "./verdict.js";

export type VerifyOptions = {
  seed: number;
  now: () => number;
  isoNow: () => string;
  maxSteps?: number;
  maxStates?: number;
  shouldStop?: () => boolean;
  onStep?: (step: TraceStep, summary: string, state: GameState) => void;
};

function firstViolation(world: WorldSpec, replay: Replay): Evidence["violation"] {
  for (const [index, state] of replay.states.entries()) {
    const [message] = assertInvariants(world, state);
    if (message !== undefined) return { step: Math.max(0, index - 1), message };
  }
  return null;
}

function playtestOptions(options: VerifyOptions): PlaytestOptions {
  return {
    seed: options.seed,
    now: options.now,
    ...(options.maxSteps === undefined ? {} : { maxSteps: options.maxSteps }),
    ...(options.shouldStop === undefined ? {} : { shouldStop: options.shouldStop }),
    ...(options.onStep === undefined ? {} : { onStep: options.onStep }),
  };
}

function gather(world: WorldSpec, options: VerifyOptions): Evidence {
  const empty = { structural: [], solve: null, run: null, replay: null, violation: null };
  if (!worldSpecSchema.safeParse(world).success) return { schemaValid: false, ...empty };
  const structural = validateWorld(world);
  const budget = options.maxStates === undefined ? {} : { maxStates: options.maxStates };
  const solved = structural.length > 0 ? null : solve(world, budget);
  const run = runPlaytest(world, playtestOptions(options));
  if (run.outcome === "CANCELLED")
    return { ...empty, schemaValid: true, structural, solve: solved, run };
  const replay = replayStates(world, options.seed, run.trace);
  const violation = firstViolation(world, replay);
  return { schemaValid: true, structural, solve: solved, run, replay, violation };
}

function guarded(verdict: Verdict, assertions: Assertion[]): Verdict {
  if (verdict.status !== "VERIFIED" || assertions.every((item) => item.passed)) return verdict;
  const reason =
    "A verified verdict was reached without every assertion passing, so it was withheld.";
  return {
    status: "ERROR",
    findings: [{ code: "UNKNOWN_FAILURE", entityIds: [], explanation: reason }],
    failureReason: reason,
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function verifyWorld(world: WorldSpec, options: VerifyOptions): VerificationReport {
  const started = options.now();
  const createdAt = options.isoNow();
  const revisionHash = worldRevisionHash(world);
  const frame = {
    reportId: sha256Hex(revisionHash + String(options.seed) + createdAt).slice(0, 16),
    createdAt,
    worldId: idSchema.safeParse(world.id).success ? world.id : "unknown-world",
    worldRevisionHash: revisionHash,
    initialSeed: options.seed,
    agentMode: "heuristic_agent" as const,
  };
  const elapsed = () => Math.max(0, options.now() - started);
  try {
    const evidence = gather(world, options);
    const assertions = assertionsOf(evidence);
    const verdict = guarded(verdictOf(evidence), assertions);
    return buildReport({
      ...frame,
      ...verdict,
      assertions,
      trace: evidence.run?.trace ?? [],
      exploredStates: evidence.solve?.exploredStates ?? null,
      elapsedMs: elapsed(),
      replayPass: evidence.replay?.pass === true,
    });
  } catch (error) {
    const blank: Evidence = {
      schemaValid: false,
      structural: [],
      solve: null,
      run: null,
      replay: null,
      violation: null,
    };
    return buildReport({
      ...frame,
      status: "ERROR",
      findings: [],
      failureReason: `The verifier stopped with an error: ${messageOf(error)}`,
      assertions: assertionsOf(blank),
      trace: [],
      exploredStates: null,
      elapsedMs: elapsed(),
      replayPass: false,
    });
  }
}
