import { describe, expect, it } from "vitest";
import type { GameAction, GameState } from "../../src/contract/game.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { stateHash, worldRevisionHash } from "../../src/domain/canonical.js";
import {
  candidateActions,
  createInitialState,
  isGoalComplete,
  stepGame,
} from "../../src/domain/step-game.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";

const winningRun: GameAction[] = [
  { type: "MOVE_TO", roomId: "library" },
  { type: "INTERACT", entityId: "key1" },
  { type: "MOVE_TO", roomId: "control" },
  { type: "INTERACT", entityId: "switch1" },
  { type: "MOVE_TO", roomId: "portal" },
];

function play(world: WorldSpec, actions: GameAction[]) {
  let state: GameState = createInitialState(world, world.seed);
  const codes: string[] = [];
  for (const action of actions) {
    const transition = stepGame(world, state, action);
    codes.push(transition.event.code);
    state = transition.state;
  }
  return { state, codes };
}

describe("stepGame on the observatory", () => {
  it("lets a player collect the key, unlock the door, enable the portal and win", () => {
    const { state, codes } = play(observatory, winningRun);
    expect(codes).toEqual([
      "MOVED",
      "ITEM_COLLECTED",
      "DOOR_UNLOCKED",
      "FLAG_SET",
      "GOAL_COMPLETE",
    ]);
    expect(state.won).toBe(true);
    expect(isGoalComplete(observatory, state)).toBe(true);
    expect(state.inventory).toEqual(["key1"]);
    expect(state.unlockedDoors).toEqual(["door1", "gate1"]);
  });

  it("refuses the locked door without the key and leaves the state untouched", () => {
    const { state } = play(observatory, [{ type: "MOVE_TO", roomId: "library" }]);
    const transition = stepGame(observatory, state, { type: "MOVE_TO", roomId: "control" });
    expect(transition.ok).toBe(false);
    expect(transition.event.code).toBe("DOOR_LOCKED");
    expect(transition.state).toBe(state);
  });

  it("refuses the portal before the switch is on", () => {
    const { state, codes } = play(observatory, winningRun.slice(0, 3));
    expect(codes.at(-1)).toBe("DOOR_UNLOCKED");
    const transition = stepGame(observatory, state, { type: "MOVE_TO", roomId: "portal" });
    expect(transition.event.code).toBe("DOOR_LOCKED");
    expect(transition.state).toBe(state);
  });

  it("rejects moves to rooms that are not adjacent", () => {
    const start = createInitialState(observatory, 1);
    expect(stepGame(observatory, start, { type: "MOVE_TO", roomId: "control" }).event.code).toBe(
      "NOT_ADJACENT",
    );
    expect(stepGame(observatory, start, { type: "MOVE_TO", roomId: "nowhere" }).event.code).toBe(
      "UNKNOWN_ROOM",
    );
  });

  it("rejects using things in another room, twice, or that cannot be used", () => {
    const start = createInitialState(observatory, 1);
    expect(stepGame(observatory, start, { type: "INTERACT", entityId: "key1" }).event.code).toBe(
      "ENTITY_NOT_HERE",
    );
    const { state } = play(observatory, winningRun.slice(0, 2));
    expect(stepGame(observatory, state, { type: "INTERACT", entityId: "key1" }).event.code).toBe(
      "ALREADY_USED",
    );
    expect(stepGame(observatory, state, { type: "INTERACT", entityId: "charts" }).event.code).toBe(
      "NOT_INTERACTIVE",
    );
  });

  it("inspects without changing anything", () => {
    const start = createInitialState(observatory, 1);
    const transition = stepGame(observatory, start, { type: "INSPECT", entityId: "telescope" });
    expect(transition.ok).toBe(true);
    expect(transition.state).toBe(start);
  });

  it("accepts nothing once the goal is complete", () => {
    const { state } = play(observatory, winningRun);
    expect(stepGame(observatory, state, { type: "WAIT", ticks: 1 }).event.code).toBe("ALREADY_WON");
  });

  it("produces the same final state hash for the same world, seed and actions", () => {
    expect(stateHash(play(observatory, winningRun).state)).toBe(
      stateHash(play(observatory, winningRun).state),
    );
  });
});

describe("the key-behind-its-own-door twin", () => {
  it("has a different revision hash from the solvable world", () => {
    expect(worldRevisionHash(observatoryKeyBehindDoor)).not.toBe(worldRevisionHash(observatory));
  });

  it("offers no way to pick up the key before the door", () => {
    const { state, codes } = play(observatoryKeyBehindDoor, [
      { type: "MOVE_TO", roomId: "library" },
      { type: "INTERACT", entityId: "key1" },
      { type: "MOVE_TO", roomId: "control" },
    ]);
    expect(codes).toEqual(["MOVED", "ENTITY_NOT_HERE", "DOOR_LOCKED"]);
    expect(state.won).toBe(false);
    expect(candidateActions(observatoryKeyBehindDoor, state)).toEqual([
      { type: "MOVE_TO", roomId: "control" },
      { type: "MOVE_TO", roomId: "entrance" },
    ]);
  });
});
