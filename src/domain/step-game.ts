import type { GameAction, GameState, GameTransition } from "../contract/game.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { canonicalJson, worldRevisionHash } from "./canonical.js";
import { accept, inspect, interact, isGoalComplete, move, reject } from "./transitions.js";
import { adjacentRoomIds, entitiesIn, isInteractive, roomById } from "./world-lookup.js";

export { isGoalComplete } from "./transitions.js";

export function createInitialState(world: WorldSpec, seed: number): GameState {
  const start = roomById(world, world.startRoomId);
  const state: GameState = {
    worldRevisionHash: worldRevisionHash(world),
    seed,
    currentRoomId: world.startRoomId,
    position: { x: start?.grid.x ?? 0, z: start?.grid.z ?? 0 },
    inventory: [],
    activeFlags: {},
    unlockedDoors: [],
    collectedEntities: [],
    gameTick: 0,
    won: false,
  };
  return { ...state, won: isGoalComplete(world, state) };
}

export function stepGame(world: WorldSpec, state: GameState, action: GameAction): GameTransition {
  if (state.won) return reject(state, "ALREADY_WON", "The goal is already complete", []);
  switch (action.type) {
    case "MOVE_TO":
      return move(world, state, action.roomId);
    case "INTERACT":
      return interact(world, state, action.entityId);
    case "INSPECT":
      return inspect(world, state, action.entityId);
    case "WAIT":
      return accept(
        world,
        { ...state, gameTick: state.gameTick + action.ticks },
        { code: "WAITED", message: `Waited ${String(action.ticks)} ticks`, affectedIds: [] },
      );
  }
}

export function candidateActions(world: WorldSpec, state: GameState): GameAction[] {
  if (state.won) return [];
  const moves = adjacentRoomIds(world, state.currentRoomId).map((roomId): GameAction => ({
    type: "MOVE_TO",
    roomId,
  }));
  const uses = entitiesIn(world, state.currentRoomId)
    .filter((entity) => isInteractive(entity) && !state.collectedEntities.includes(entity.id))
    .map((entity): GameAction => ({ type: "INTERACT", entityId: entity.id }));
  return [...moves, ...uses];
}

export function serializeGameState(state: GameState): string {
  return canonicalJson(state);
}
