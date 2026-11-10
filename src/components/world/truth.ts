import type { Expr } from "../../contract/expr.schema.js";
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

function wants(expr: Expr, entity: WorldEntity): boolean {
  switch (expr.op) {
    case "true":
      return false;
    case "hasItem":
      return expr.itemId === entity.grantsItemId;
    case "flag":
      return expr.value && expr.flagId === entity.setsFlag;
    case "all":
    case "any":
      return expr.of.some((child) => wants(child, entity));
  }
}

export function keyOpens(world: WorldSpec, entity: WorldEntity): string[] {
  return world.connections
    .filter(
      (connection) =>
        entity.blocksConnectionId === connection.id || wants(connection.traversableWhen, entity),
    )
    .map((connection) => connection.id);
}
