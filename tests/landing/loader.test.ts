import { describe, expect, it } from "vitest";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { runPlaytest } from "../../src/agents/playtest.js";
import { solve } from "../../src/verification/solve.js";
import { loaderPhases, loaderSteps } from "../../src/components/landing/loader-steps.js";

const clock = () => 0;

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
    const run = runPlaytest(observatory, { seed: observatory.seed, now: clock });
    expect(valueOf("Agent")).toBe(
      `${String(run.trace.length)} steps · ${run.outcome.replace("_", " ")}`,
    );
  });

  it("the broken twin is never reported solvable", () => {
    expect(valueOf("Solve", observatoryKeyBehindDoor)).toMatch(/PROVEN_UNREACHABLE$/);
    expect(valueOf("Agent", observatoryKeyBehindDoor)).not.toMatch(/GOAL REACHED/);
  });

  it("phases run only when asked, one at a time", () => {
    let reads = 0;
    const phases = loaderPhases(observatory, () => {
      reads += 1;
      return 0;
    });
    expect(reads).toBe(0);
    for (const phase of phases) phase.run();
    expect(reads).toBeGreaterThan(0);
  });
});
