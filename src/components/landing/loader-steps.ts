import type { WorldSpec } from "../../contract/world.schema.js";
import { runPlaytest } from "../../agents/playtest.js";
import { worldRevisionHash } from "../../domain/canonical.js";
import { solve } from "../../verification/solve.js";
import { validateWorld } from "../../verification/validate-world.js";

export type LoaderStep = { label: string; value: string };
export type LoaderPhase = { label: string; run: () => string };

function plural(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

export function loaderPhases(world: WorldSpec, clock: () => number): LoaderPhase[] {
  return [
    { label: "Load world", run: () => world.id },
    { label: "Hash", run: () => worldRevisionHash(world).slice(0, 6) },
    { label: "Check", run: () => plural(validateWorld(world).length, "finding") },
    {
      label: "Solve",
      run: () => {
        const solved = solve(world);
        return `${plural(solved.exploredStates, "state")} · ${solved.status}`;
      },
    },
    {
      label: "Agent",
      run: () => {
        const run = runPlaytest(world, { seed: world.seed, now: clock });
        return `${plural(run.trace.length, "step")} · ${run.outcome.replace("_", " ")}`;
      },
    },
  ];
}

export function loaderSteps(world: WorldSpec, clock: () => number): LoaderStep[] {
  return loaderPhases(world, clock).map((phase) => ({ label: phase.label, value: phase.run() }));
}
