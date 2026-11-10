import type { GameState } from "../contract/game.schema.js";
import type { TraceStep } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { stateHash } from "../domain/canonical.js";
import { createInitialState, stepGame } from "../domain/step-game.js";

export type Replay = {
  pass: boolean;
  mismatchAt: number | null;
  finalState: GameState;
  states: GameState[];
};

function matches(world: WorldSpec, state: GameState, step: TraceStep, index: number) {
  if (step.index !== index || stateHash(state) !== step.stateHashBefore) return null;
  const transition = stepGame(world, state, step.action);
  const same =
    transition.ok === step.accepted &&
    transition.event.code === step.eventCode &&
    stateHash(transition.state) === step.stateHashAfter;
  return same ? transition.state : null;
}

export function replayStates(world: WorldSpec, seed: number, trace: readonly TraceStep[]): Replay {
  let state = createInitialState(world, seed);
  const states = [state];
  for (const [index, step] of trace.entries()) {
    const next = matches(world, state, step, index);
    if (next === null) return { pass: false, mismatchAt: index, finalState: state, states };
    state = next;
    states.push(state);
  }
  return { pass: true, mismatchAt: null, finalState: state, states };
}

export function replayTrace(
  world: WorldSpec,
  seed: number,
  trace: readonly TraceStep[],
): { pass: boolean; mismatchAt: number | null; finalState: GameState } {
  const { pass, mismatchAt, finalState } = replayStates(world, seed, trace);
  return { pass, mismatchAt, finalState };
}
