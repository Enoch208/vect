import { describe, expect, it } from "vitest";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { stateHash } from "../../src/domain/canonical.js";
import { createInitialState, stepGame } from "../../src/domain/step-game.js";
import { entitiesIn } from "../../src/domain/world-lookup.js";
import { emptyMemory, learn, remember } from "../../src/agents/memory.js";
import { chooseAction } from "../../src/agents/heuristic-agent.js";
import { observeWorld } from "../../src/agents/observe.js";
import { runPlaytest } from "../../src/agents/playtest.js";
import { seededRandom } from "../../src/domain/random.js";
import { backtrackingWorld, goalSeenTooEarly } from "../../src/fixtures/suite-agent.js";
import {
  keyBeforeDoor,
  routeAroundTrap,
  switchBehindOpenRoute,
  twoSequentialLocks,
} from "../../src/fixtures/suite-gameplay.js";
import { tenRoomTemple } from "../../src/fixtures/suite-large.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";

const clock = () => 0;

function play(world: WorldSpec, seed = 11, maxSteps?: number) {
  return runPlaytest(world, { seed, now: clock, ...(maxSteps === undefined ? {} : { maxSteps }) });
}

describe("runPlaytest", () => {
  it("observatory: GOAL_REACHED within 20 steps", () => {
    const run = play(observatory);
    expect(run.outcome).toBe("GOAL_REACHED");
    expect(run.trace.length).toBeLessThanOrEqual(20);
    expect(run.trace.at(-1)?.eventCode).toBe("GOAL_COMPLETE");
    expect(run.finalState.won).toBe(true);
    expect(run.summaries).toHaveLength(run.trace.length);
    expect(run.summaries).toContain("Picked up Access Key");
  });

  it("twin: STUCK, never won", () => {
    const run = play(observatoryKeyBehindDoor);
    expect(run.outcome).toBe("STUCK");
    expect(run.finalState.won).toBe(false);
    const locked = run.trace.findIndex((step) => step.eventCode === "DOOR_LOCKED");
    expect(locked).toBeGreaterThanOrEqual(0);
    expect(run.summaries[locked]).toContain("Control Room Door");
  });

  it("backtracking world: GOAL_REACHED within 150 steps", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const run = play(backtrackingWorld, seed);
      expect(run.outcome, `seed ${String(seed)}`).toBe("GOAL_REACHED");
      expect(run.trace.length).toBeLessThanOrEqual(150);
    }
  });

  it("returns to a goal room it saw before the goal could hold", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const run = play(goalSeenTooEarly, seed);
      expect(run.outcome, `seed ${String(seed)}`).toBe("GOAL_REACHED");
    }
  });

  it("reaches the goal in every solvable gameplay fixture", () => {
    const worlds = [keyBeforeDoor, switchBehindOpenRoute, twoSequentialLocks, routeAroundTrap];
    for (const world of [...worlds, tenRoomTemple]) {
      expect(play(world).outcome, world.id).toBe("GOAL_REACHED");
    }
  });

  it("records state hashes that chain step to step", () => {
    const run = play(twoSequentialLocks);
    expect(run.trace[0]?.stateHashBefore).toBe(
      stateHash(createInitialState(twoSequentialLocks, 11)),
    );
    for (const [index, step] of run.trace.entries()) {
      expect(step.index).toBe(index);
      if (index > 0) expect(step.stateHashBefore).toBe(run.trace[index - 1]?.stateHashAfter);
    }
    expect(run.trace.at(-1)?.stateHashAfter).toBe(stateHash(run.finalState));
  });

  it("same seed gives the same trace", () => {
    expect(play(tenRoomTemple, 5)).toEqual(play(tenRoomTemple, 5));
  });

  it("stops at the step budget", () => {
    const run = play(tenRoomTemple, 5, 3);
    expect(run.outcome).toBe("BUDGET_EXHAUSTED");
    expect(run.trace).toHaveLength(3);
  });

  it("shouldStop gives CANCELLED", () => {
    let calls = 0;
    const run = runPlaytest(observatory, {
      seed: 1,
      now: clock,
      shouldStop: () => ++calls > 2,
    });
    expect(run.outcome).toBe("CANCELLED");
    expect(run.trace).toHaveLength(2);
  });

  it("measures elapsed time with the injected clock", () => {
    let tick = 100;
    const run = runPlaytest(observatory, { seed: 1, now: () => (tick += 5) });
    expect(run.elapsedMs).toBeGreaterThan(0);
  });
});

describe("observeWorld", () => {
  it("observation never includes entities outside the current room", () => {
    let state = createInitialState(tenRoomTemple, 3);
    let memory = emptyMemory();
    const random = seededRandom(3);
    for (let step = 0; step < 40 && !state.won; step++) {
      const observation = observeWorld(tenRoomTemple, state, memory);
      const here = entitiesIn(tenRoomTemple, state.currentRoomId).map((item) => item.id);
      expect(observation.entities.map((item) => item.id).every((id) => here.includes(id))).toBe(
        true,
      );
      memory = remember(memory, observation);
      const choice = chooseAction(observation, memory, random);
      if (choice === null) break;
      const transition = stepGame(tenRoomTemple, state, choice.action);
      memory = learn(memory, observation, choice.action, transition);
      state = transition.state;
    }
  });
});
