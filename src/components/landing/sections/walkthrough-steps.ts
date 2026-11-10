import type { EventCode } from "../../../contract/codes.js";
import type { GameAction, GameState } from "../../../contract/game.schema.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { runPlaytest } from "../../../agents/playtest.js";
import { replayStates } from "../../../verification/replay.js";

export type WalkthroughStep = {
  index: number;
  code: EventCode;
  caption: string;
  action: GameAction;
  accepted: boolean;
  state: GameState;
};

export type Walkthrough = {
  start: GameState;
  steps: WalkthroughStep[];
  replay: { pass: boolean; mismatchAt: number | null };
};

export function walkthrough(world: WorldSpec): Walkthrough {
  const run = runPlaytest(world, { seed: world.seed, now: () => 0 });
  const { states, pass, mismatchAt } = replayStates(world, world.seed, run.trace);
  const start = states[0] ?? run.finalState;
  const steps = run.trace.map((step, index) => ({
    index: step.index,
    code: step.eventCode,
    caption: run.summaries[index] ?? "",
    action: step.action,
    accepted: step.accepted,
    state: states[index + 1] ?? run.finalState,
  }));
  return { start, steps, replay: { pass, mismatchAt } };
}

export function walkthroughSteps(world: WorldSpec): WalkthroughStep[] {
  return walkthrough(world).steps;
}
