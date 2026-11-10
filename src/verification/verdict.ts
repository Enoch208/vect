import type { TestStatus } from "../contract/codes.js";
import type { Assertion, Finding } from "../contract/report.schema.js";
import type { PlaytestRun } from "../agents/playtest.js";
import type { Replay } from "./replay.js";
import type { SolveResult } from "./solve.js";

export type Evidence = {
  schemaValid: boolean;
  structural: Finding[];
  solve: SolveResult | null;
  run: PlaytestRun | null;
  replay: Replay | null;
  violation: { step: number; message: string } | null;
};

export type Verdict = { status: TestStatus; findings: Finding[]; failureReason: string | null };

const unknown = (explanation: string): Finding => ({
  code: "UNKNOWN_FAILURE",
  entityIds: [],
  explanation,
});

export function assertionsOf(e: Evidence): Assertion[] {
  const reached = e.run?.outcome === "GOAL_REACHED";
  const lastStep = e.run === null ? null : Math.max(0, e.run.trace.length - 1);
  return [
    { id: "schema-valid", passed: e.schemaValid, evidenceStep: null },
    {
      id: "structure-sound",
      passed: e.schemaValid && e.structural.length === 0,
      evidenceStep: null,
    },
    { id: "solver-solvable", passed: e.solve?.status === "SOLVABLE", evidenceStep: null },
    { id: "agent-reached-goal", passed: reached, evidenceStep: reached ? lastStep : null },
    {
      id: "replay-matches",
      passed: e.replay?.pass === true,
      evidenceStep: e.replay?.mismatchAt ?? null,
    },
    {
      id: "invariants-hold",
      passed: e.replay !== null && e.violation === null,
      evidenceStep: e.violation?.step ?? null,
    },
  ];
}

function solvableVerdict(run: PlaytestRun, replay: Replay): Verdict {
  if (run.outcome === "GOAL_REACHED" && replay.finalState.won) {
    return { status: "VERIFIED", findings: [], failureReason: null };
  }
  if (run.outcome === "BUDGET_EXHAUSTED") {
    const explanation = `The playtest agent used all ${String(run.trace.length)} of its steps before reaching the goal, although the solver found a way.`;
    return {
      status: "INCONCLUSIVE",
      findings: [{ code: "TEST_BUDGET_EXHAUSTED", entityIds: [], explanation }],
      failureReason: explanation,
    };
  }
  if (run.outcome === "STUCK") {
    return {
      status: "INCONCLUSIVE",
      findings: [],
      failureReason:
        "The solver found a way to finish, but the playtest agent got stuck before reaching the goal.",
    };
  }
  const reason = `The playtest ended as ${run.outcome} without a replayed win.`;
  return { status: "ERROR", findings: [unknown(reason)], failureReason: reason };
}

export function verdictOf(e: Evidence): Verdict {
  if (!e.schemaValid) {
    const reason = "The world does not match the world schema, so nothing else was checked.";
    const finding: Finding = { code: "INVALID_INTERACTION", entityIds: [], explanation: reason };
    return { status: "FAILED", findings: [finding], failureReason: reason };
  }
  const { run, replay } = e;
  if (run === null || run.outcome === "CANCELLED" || replay === null) {
    return {
      status: "CANCELLED",
      findings: [],
      failureReason: "The test was cancelled before it finished.",
    };
  }
  if (!replay.pass) {
    const reason = `The recorded run did not replay identically at step ${String(replay.mismatchAt)}.`;
    return { status: "ERROR", findings: [unknown(reason)], failureReason: reason };
  }
  if (e.structural.length > 0) {
    return {
      status: "FAILED",
      findings: e.structural,
      failureReason: "The world has structural faults.",
    };
  }
  if (e.violation !== null) {
    const reason = `At step ${String(e.violation.step)}: ${e.violation.message}.`;
    return { status: "FAILED", findings: [unknown(reason)], failureReason: reason };
  }
  if (e.solve === null) {
    return { status: "ERROR", findings: [], failureReason: "The solver did not run." };
  }
  if (e.solve.status === "PROVEN_UNREACHABLE") {
    if (replay.finalState.won) {
      const reason =
        "The agent reached the goal on a world the solver proved impossible, so the engine disagrees with itself.";
      return { status: "ERROR", findings: [unknown(reason)], failureReason: reason };
    }
    return {
      status: "FAILED",
      findings: e.solve.findings,
      failureReason: "The solver explored every reachable state and none completes the goal.",
    };
  }
  if (e.solve.status === "INCONCLUSIVE") {
    return {
      status: "INCONCLUSIVE",
      findings: e.solve.findings,
      failureReason: "The solver ran out of budget before it could decide.",
    };
  }
  return solvableVerdict(run, replay);
}
