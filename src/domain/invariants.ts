import type { GameState } from "../contract/game.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { isGoalComplete } from "./transitions.js";
import { entityById, isInteractive, roomById } from "./world-lookup.js";

function repeated(values: readonly string[]): string[] {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

function strayItems(world: WorldSpec, state: GameState): string[] {
  const granted = new Set(
    world.entities.flatMap((item) => (item.grantsItemId === null ? [] : [item.grantsItemId])),
  );
  return state.inventory
    .filter((item) => !granted.has(item))
    .map((item) => `Inventory holds ${item}, which nothing in the world grants`);
}

function strayUses(world: WorldSpec, state: GameState): string[] {
  return state.collectedEntities
    .filter((id) => {
      const entity = entityById(world, id);
      return entity === null || !isInteractive(entity);
    })
    .map((id) => `${id} is marked used but is not an interactive entity`);
}

function strayDoors(world: WorldSpec, state: GameState): string[] {
  const gates = new Set(
    world.connections.flatMap((item) => (item.doorId === null ? [] : [item.doorId])),
  );
  return state.unlockedDoors
    .filter((id) => !gates.has(id))
    .map((id) => `${id} is unlocked but no connection uses it as a gate`);
}

function duplicates(state: GameState): string[] {
  const lists = {
    inventory: state.inventory,
    "used entities": state.collectedEntities,
    "unlocked doors": state.unlockedDoors,
  };
  return Object.entries(lists).flatMap(([name, values]) =>
    repeated(values).map((value) => `${value} appears more than once in ${name}`),
  );
}

export function assertInvariants(world: WorldSpec, state: GameState): string[] {
  return [
    ...(roomById(world, state.currentRoomId) === null
      ? [`The player is in ${state.currentRoomId}, which is not a room`]
      : []),
    ...(state.won && !isGoalComplete(world, state)
      ? ["The game is marked won but the goal is not complete"]
      : []),
    ...strayItems(world, state),
    ...strayUses(world, state),
    ...strayDoors(world, state),
    ...duplicates(state),
  ];
}
