import { describe, expect, it } from "vitest";
import type { GameAction, GameState } from "../../src/contract/game.schema.js";
import { assertInvariants } from "../../src/domain/invariants.js";
import { createInitialState, stepGame } from "../../src/domain/step-game.js";
import { observatory } from "../../src/fixtures/observatory.js";

const winningRun: GameAction[] = [
  { type: "MOVE_TO", roomId: "library" },
  { type: "INTERACT", entityId: "key1" },
  { type: "MOVE_TO", roomId: "control" },
  { type: "INTERACT", entityId: "switch1" },
  { type: "MOVE_TO", roomId: "portal" },
];

const start = createInitialState(observatory, 1);

function broken(change: Partial<GameState>): string[] {
  return assertInvariants(observatory, { ...start, ...change });
}

describe("assertInvariants", () => {
  it("holds on every state of a real winning run", () => {
    let state = start;
    expect(assertInvariants(observatory, state)).toEqual([]);
    for (const action of winningRun) {
      state = stepGame(observatory, state, action).state;
      expect(assertInvariants(observatory, state)).toEqual([]);
    }
    expect(state.won).toBe(true);
  });

  it("flags an item nothing in the world grants", () => {
    expect(broken({ inventory: ["ghost"] })).toHaveLength(1);
  });

  it("flags a used entity that cannot be used", () => {
    expect(broken({ collectedEntities: ["charts"] })).toHaveLength(1);
  });

  it("flags a win the goal does not support", () => {
    expect(broken({ won: true })).toHaveLength(1);
  });

  it("flags an unknown room", () => {
    expect(broken({ currentRoomId: "attic" })).toHaveLength(1);
  });

  it("flags an unlocked door that no connection names", () => {
    expect(broken({ unlockedDoors: ["charts"] })).toHaveLength(1);
  });

  it("flags duplicates", () => {
    expect(broken({ inventory: ["key1", "key1"] })).toHaveLength(1);
    expect(broken({ unlockedDoors: ["door1", "door1"] })).toHaveLength(1);
  });
});
