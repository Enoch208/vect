import { describe, expect, it } from "vitest";
import type { VerificationReport } from "../../src/contract/report.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { doorNeedsMissingKey } from "../../src/fixtures/suite-structural.js";
import { replayTrace } from "../../src/verification/replay.js";
import {
  buildReport,
  reportStatusFor,
  verifyReportIntegrity,
  type ReportBodyInput,
} from "../../src/verification/report.js";
import { verifyWorld } from "../../src/verification/verify.js";

const createdAt = "2026-11-10T19:00:00.000Z";
const options = { seed: 11, now: () => 0, isoNow: () => createdAt };

function reportOf(world: WorldSpec, extra: Partial<Parameters<typeof verifyWorld>[1]> = {}) {
  return verifyWorld(world, { ...options, ...extra });
}

function reissue(report: VerificationReport, change: Partial<ReportBodyInput>) {
  const body: ReportBodyInput = {
    reportId: report.reportId,
    createdAt: report.createdAt,
    worldId: report.worldId,
    worldRevisionHash: report.worldRevisionHash,
    initialSeed: report.initialSeed,
    agentMode: report.agentMode,
    status: report.status,
    assertions: report.assertions,
    findings: report.findings,
    trace: report.trace,
    exploredStates: report.exploredStates,
    elapsedMs: report.elapsedMs,
    failureReason: report.failureReason,
    replayPass: report.replayPass,
  };
  return buildReport({ ...body, ...change });
}

const assertionIds = [
  "schema-valid",
  "structure-sound",
  "solver-solvable",
  "agent-reached-goal",
  "replay-matches",
  "invariants-hold",
];

describe("verifyWorld", () => {
  it("observatory verifies", () => {
    const report = reportOf(observatory);
    expect(report.status).toBe("VERIFIED");
    expect(report.replayPass).toBe(true);
    expect(report.assertions.map((item) => item.id)).toEqual(assertionIds);
    expect(report.assertions.every((item) => item.passed)).toBe(true);
    expect(report.findings).toEqual([]);
    expect(report.failureReason).toBeNull();
    expect(report.worldRevisionHash).toBe(worldRevisionHash(observatory));
    expect(report.initialSeed).toBe(11);
    expect(report.agentMode).toBe("heuristic_agent");
    expect(report.exploredStates).toBeGreaterThan(0);
    expect(report.trace.at(-1)?.eventCode).toBe("GOAL_COMPLETE");
    expect(report.reportId).toMatch(/^[0-9a-f]{16}$/);
    expect(verifyReportIntegrity(report)).toBe(true);
    expect(reportStatusFor(observatory, report)).toBe("VERIFIED");
  });

  it("F-01 fails with CIRCULAR_DEPENDENCY and an agent trace", () => {
    const report = reportOf(observatoryKeyBehindDoor);
    expect(report.status).toBe("FAILED");
    expect(report.findings[0]?.code).toBe("CIRCULAR_DEPENDENCY");
    expect(report.trace.length).toBeGreaterThan(0);
    expect(report.trace.some((step) => step.eventCode === "DOOR_LOCKED")).toBe(true);
    const passed = Object.fromEntries(report.assertions.map((item) => [item.id, item.passed]));
    expect(passed["solver-solvable"]).toBe(false);
    expect(passed["agent-reached-goal"]).toBe(false);
    expect(report.failureReason).not.toBeNull();
  });

  it("a structural fault fails before any search, with the agent run as evidence", () => {
    const report = reportOf(doorNeedsMissingKey);
    expect(report.status).toBe("FAILED");
    expect(report.findings.map((item) => item.code)).toEqual(["MISSING_REQUIRED_ITEM"]);
    expect(report.exploredStates).toBeNull();
    expect(report.trace.length).toBeGreaterThan(0);
  });

  it("names a structural cause ahead of the invariant it breaks downstream", () => {
    const report = reportOf({ ...observatory, startRoomId: "lobby" });
    expect(report.status).toBe("FAILED");
    expect(report.findings.map((item) => item.code)).toEqual(["ORPHAN_ENTITY"]);
  });

  it("F-06 budget gives INCONCLUSIVE", () => {
    const report = reportOf(observatory, { maxStates: 2 });
    expect(report.status).toBe("INCONCLUSIVE");
    expect(report.findings.map((item) => item.code)).toContain("TEST_BUDGET_EXHAUSTED");
  });

  it("an agent out of steps on a solvable world is INCONCLUSIVE, never VERIFIED", () => {
    const report = reportOf(observatory, { maxSteps: 2 });
    expect(report.status).toBe("INCONCLUSIVE");
    expect(report.trace).toHaveLength(2);
  });

  it("shouldStop gives CANCELLED", () => {
    const report = reportOf(observatory, { shouldStop: () => true });
    expect(report.status).toBe("CANCELLED");
    expect(report.replayPass).toBe(false);
  });

  it("an exception gives ERROR, not a world verdict", () => {
    const report = reportOf(observatory, {
      onStep: () => {
        throw new Error("renderer went away");
      },
    });
    expect(report.status).toBe("ERROR");
    expect(report.failureReason).toContain("renderer went away");
    expect(verifyReportIntegrity(report)).toBe(true);
  });

  it("streams every step it records", () => {
    const seen: number[] = [];
    const report = reportOf(observatory, { onStep: (step) => seen.push(step.index) });
    expect(seen).toEqual(report.trace.map((step) => step.index));
  });

  it("is reproducible for the same world, seed and clock", () => {
    expect(reportOf(observatory)).toEqual(reportOf(observatory));
  });
});

describe("report integrity and status", () => {
  const verified = reportOf(observatory);
  const failed = reportOf(observatoryKeyBehindDoor);

  it("F-07 an edit makes the report STALE", () => {
    expect(reportStatusFor(observatoryKeyBehindDoor, verified)).toBe("STALE");
  });

  it("F-08 a tampered trace action breaks integrity", () => {
    const trace = verified.trace.map((step, index) =>
      index === 1 ? { ...step, action: { type: "WAIT" as const, ticks: 1 } } : step,
    );
    const tampered = { ...verified, trace };
    expect(verifyReportIntegrity(tampered)).toBe(false);
    expect(reportStatusFor(observatory, tampered)).toBe("ERROR");
  });

  it("F-08 a tampered world hash breaks integrity", () => {
    const tampered = {
      ...verified,
      worldRevisionHash: worldRevisionHash(observatoryKeyBehindDoor),
    };
    expect(verifyReportIntegrity(tampered)).toBe(false);
    expect(reportStatusFor(observatoryKeyBehindDoor, tampered)).toBe("ERROR");
  });

  it("F-08 a tampered seed breaks integrity", () => {
    expect(verifyReportIntegrity({ ...verified, initialSeed: 12 })).toBe(false);
  });

  it("F-09 flipping status to VERIFIED breaks integrity", () => {
    const flipped = { ...failed, status: "VERIFIED" as const };
    expect(verifyReportIntegrity(flipped)).toBe(false);
    expect(reportStatusFor(observatoryKeyBehindDoor, flipped)).toBe("ERROR");
  });

  it("a VERIFIED claim with a recomputed digest still has to replay to a win", () => {
    const forged = reissue(failed, { status: "VERIFIED" });
    expect(verifyReportIntegrity(forged)).toBe(true);
    expect(reportStatusFor(observatoryKeyBehindDoor, forged)).toBe("ERROR");
  });

  it("a malformed report is never trusted", () => {
    expect(verifyReportIntegrity({ ...verified, reportDigest: "" })).toBe(false);
  });
});

describe("replayTrace", () => {
  const report = reportOf(observatory);

  it("passes on the recorded run", () => {
    const replay = replayTrace(observatory, 11, report.trace);
    expect(replay.pass).toBe(true);
    expect(replay.mismatchAt).toBeNull();
    expect(replay.finalState.won).toBe(true);
  });

  it("replay detects a swapped action", () => {
    const swapped = report.trace.map((step, index) =>
      index === 1 ? { ...step, action: { type: "INTERACT" as const, entityId: "charts" } } : step,
    );
    const replay = replayTrace(observatory, 11, swapped);
    expect(replay.pass).toBe(false);
    expect(replay.mismatchAt).toBe(1);
  });

  it("fails at the first step on another revision or seed", () => {
    expect(replayTrace(observatoryKeyBehindDoor, 11, report.trace).mismatchAt).toBe(0);
    expect(replayTrace(observatory, 12, report.trace).mismatchAt).toBe(0);
  });
});
