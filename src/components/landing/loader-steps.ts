import type { WorldSpec } from "../../contract/world.schema.js";
import { runPlaytest, type PlaytestRun } from "../../agents/playtest.js";
import { worldRevisionHash } from "../../domain/canonical.js";
import { replayTrace } from "../../verification/replay.js";
import { solve } from "../../verification/solve.js";
import { validateWorld } from "../../verification/validate-world.js";
import { verifyWorld } from "../../verification/verify.js";

export type LoaderStep = { label: string; value: string };
export type LoaderPhase = { label: string; run: () => string };
export type LoaderClock = { now: () => number; isoNow: () => string };

function plural(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

export function loaderPhases(world: WorldSpec, clock: LoaderClock): LoaderPhase[] {
  let played: PlaytestRun | null = null;
  const play = () => {
    played ??= runPlaytest(world, { seed: world.seed, now: clock.now });
    return played;
  };
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
        const run = play();
        return `${plural(run.trace.length, "step")} · ${run.outcome.replace("_", " ")}`;
      },
    },
    {
      label: "Replay",
      run: () => {
        const replay = replayTrace(world, world.seed, play().trace);
        return replay.pass ? "match" : `mismatch at step ${String(replay.mismatchAt ?? 0)}`;
      },
    },
    {
      label: "Verdict",
      run: () => {
        const report = verifyWorld(world, { seed: world.seed, ...clock });
        return `${report.status} · ${report.reportDigest.slice(0, 6)}`;
      },
    },
  ];
}

export function loaderSteps(world: WorldSpec, clock: LoaderClock): LoaderStep[] {
  return loaderPhases(world, clock).map((phase) => ({ label: phase.label, value: phase.run() }));
}
