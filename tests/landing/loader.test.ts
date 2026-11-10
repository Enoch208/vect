import { describe, expect, it } from "vitest";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { runPlaytest } from "../../src/agents/playtest.js";
import { replayTrace } from "../../src/verification/replay.js";
import { solve } from "../../src/verification/solve.js";
import { verifyWorld } from "../../src/verification/verify.js";
import { loaderPhases, loaderSteps } from "../../src/components/landing/loader-steps.js";

const clock = { now: () => 0, isoNow: () => "2026-11-10T12:00:00.000Z" };

function valueOf(label: string, world = observatory): string | undefined {
  return loaderSteps(world, clock).find((step) => step.label === label)?.value;
}

describe("honest loader", () => {
  it("loader steps carry the real revision hash of the example world", () => {
    const steps = loaderSteps(observatory, clock);
    expect(steps[0]).toEqual({ label: "Load world", value: "observatory-01" });
    expect(steps.map((step) => step.value)).toContain(worldRevisionHash(observatory).slice(0, 6));
  });

  it("the solve step reports the solver's own explored-state count", () => {
    const solved = solve(observatory);
    expect(valueOf("Solve")).toBe(`${String(solved.exploredStates)} states · ${solved.status}`);
  });

  it("the agent step reports the real playtest length and outcome", () => {
    const run = runPlaytest(observatory, { seed: observatory.seed, now: clock.now });
    expect(valueOf("Agent")).toBe(
      `${String(run.trace.length)} steps · ${run.outcome.replace("_", " ")}`,
    );
  });

  it("the replay step replays the agent's own trace", () => {
    const run = runPlaytest(observatory, { seed: observatory.seed, now: clock.now });
    const replay = replayTrace(observatory, observatory.seed, run.trace);
    expect(replay.pass).toBe(true);
    expect(valueOf("Replay")).toBe("match");
  });

  it("the verdict is the verifier's own status and digest", () => {
    const report = verifyWorld(observatory, { seed: observatory.seed, ...clock });
    expect(valueOf("Verdict")).toBe(`${report.status} · ${report.reportDigest.slice(0, 6)}`);
  });

  it("the broken twin is never reported verified", () => {
    expect(valueOf("Verdict", observatoryKeyBehindDoor)).not.toMatch(/^VERIFIED/);
  });

  it("the broken twin is never reported solvable", () => {
    expect(valueOf("Solve", observatoryKeyBehindDoor)).toMatch(/PROVEN_UNREACHABLE$/);
    expect(valueOf("Agent", observatoryKeyBehindDoor)).not.toMatch(/GOAL REACHED/);
  });

  it("phases run only when asked, one at a time", () => {
    let reads = 0;
    const phases = loaderPhases(observatory, {
      now: () => {
        reads += 1;
        return 0;
      },
      isoNow: clock.isoNow,
    });
    expect(reads).toBe(0);
    for (const phase of phases) phase.run();
    expect(reads).toBeGreaterThan(0);
  });
});
