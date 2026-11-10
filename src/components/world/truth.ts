import type { GameState } from "../../contract/game.schema.js";
import type { Connection, WorldEntity, WorldSpec } from "../../contract/world.schema.js";
import { isTraversable } from "../../domain/world-lookup.js";

export type GateState = "closed" | "open" | "passed";

export function gateState(world: WorldSpec, state: GameState, connection: Connection): GateState {
  if (!isTraversable(world, state, connection)) return "closed";
  const passed = connection.doorId !== null && state.unlockedDoors.includes(connection.doorId);
  return passed ? "passed" : "open";
}

export function gateStates(world: WorldSpec, state: GameState): Map<string, GateState> {
  return new Map(
    world.connections.map((connection) => [connection.id, gateState(world, state, connection)]),
  );
}

export function isUsed(state: GameState, entityId: string): boolean {
  return state.collectedEntities.includes(entityId);
}

export function switchIsOn(state: GameState, entity: WorldEntity): boolean {
  return entity.setsFlag !== null && state.activeFlags[entity.setsFlag] === true;
}

export function keyOpens(world: WorldSpec, entity: WorldEntity): string[] {
  const grants = entity.grantsItemId;
  const flag = entity.setsFlag;
  return world.connections
    .filter((connection) => {
      const needs = JSON.stringify(connection.traversableWhen);
      const byItem = grants !== null && needs.includes(`"itemId":"${grants}"`);
      const byFlag = flag !== null && needs.includes(`"flagId":"${flag}"`);
      return byItem || byFlag || entity.blocksConnectionId === connection.id;
    })
    .map((connection) => connection.id);
}
