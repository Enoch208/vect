import type { GameState } from "../contract/game.schema.js";
import type { TraceStep } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { stateHash } from "../domain/canonical.js";
import { seededRandom } from "../domain/random.js";
import { createInitialState, stepGame } from "../domain/step-game.js";
import { chooseAction } from "./heuristic-agent.js";
import { emptyMemory, learn, remember } from "./memory.js";
import { observeWorld } from "./observe.js";
import { summarize } from "./summarize.js";

export const defaultMaxSteps = 150;

export type PlaytestOutcome = "GOAL_REACHED" | "STUCK" | "BUDGET_EXHAUSTED" | "CANCELLED";

export type PlaytestRun = {
  trace: TraceStep[];
  summaries: string[];
  finalState: GameState;
  outcome: PlaytestOutcome;
  elapsedMs: number;
};

export type PlaytestOptions = {
  seed: number;
  maxSteps?: number;
  now: () => number;
  shouldStop?: () => boolean;
  onStep?: (step: TraceStep, summary: string, state: GameState) => void;
};

function stopReason(
  state: GameState,
  options: PlaytestOptions,
  steps: number,
): PlaytestOutcome | null {
  if (state.won) return "GOAL_REACHED";
  if (options.shouldStop?.() === true) return "CANCELLED";
  if (steps >= (options.maxSteps ?? defaultMaxSteps)) return "BUDGET_EXHAUSTED";
  return null;
}

export function runPlaytest(world: WorldSpec, options: PlaytestOptions): PlaytestRun {
  const started = options.now();
  const random = seededRandom(options.seed);
  const trace: TraceStep[] = [];
  const summaries: string[] = [];
  let state = createInitialState(world, options.seed);
  let memory = emptyMemory();
  let outcome = stopReason(state, options, 0);
  while (outcome === null) {
    const observation = observeWorld(world, state, memory);
    memory = remember(memory, observation);
    const choice = chooseAction(observation, memory, random);
    if (choice === null) {
      outcome = "STUCK";
      break;
    }
    const transition = stepGame(world, state, choice.action);
    const step: TraceStep = {
      index: trace.length,
      action: choice.action,
      accepted: transition.ok,
      eventCode: transition.event.code,
      stateHashBefore: stateHash(state),
      stateHashAfter: stateHash(transition.state),
    };
    const summary = summarize(world, choice, transition);
    trace.push(step);
    summaries.push(summary);
    memory = learn(memory, observation, choice.action, transition);
    state = transition.state;
    options.onStep?.(step, summary, state);
    outcome = stopReason(state, options, trace.length);
  }
  return { trace, summaries, finalState: state, outcome, elapsedMs: options.now() - started };
}
