import { interactiveKinds, type EntityKind } from "../contract/codes.js";
import type { GameState } from "../contract/game.schema.js";
import type { Connection, Room, WorldEntity, WorldSpec } from "../contract/world.schema.js";
import { evaluate } from "./expr.js";

const interactive: readonly EntityKind[] = interactiveKinds;

export function roomById(world: WorldSpec, roomId: string): Room | null {
  return world.rooms.find((room) => room.id === roomId) ?? null;
}

export function entityById(world: WorldSpec, entityId: string): WorldEntity | null {
  return world.entities.find((entity) => entity.id === entityId) ?? null;
}

export function isInteractive(entity: WorldEntity): boolean {
  return interactive.includes(entity.kind);
}

export function connectionsBetween(world: WorldSpec, a: string, b: string): Connection[] {
  return world.connections.filter(
    (connection) =>
      (connection.fromRoomId === a && connection.toRoomId === b) ||
      (connection.fromRoomId === b && connection.toRoomId === a),
  );
}

export function adjacentRoomIds(world: WorldSpec, roomId: string): string[] {
  const neighbours = world.connections.flatMap((connection) => {
    if (connection.fromRoomId === roomId) return [connection.toRoomId];
    if (connection.toRoomId === roomId) return [connection.fromRoomId];
    return [];
  });
  return [...new Set(neighbours)].filter((id) => id !== roomId).sort();
}

export function blockersOf(world: WorldSpec, connection: Connection): WorldEntity[] {
  return world.entities.filter((entity) => entity.blocksConnectionId === connection.id);
}

export function blockersCleared(world: WorldSpec, state: GameState, connection: Connection) {
  return blockersOf(world, connection).every((blocker) =>
    state.collectedEntities.includes(blocker.id),
  );
}

export function gateOpen(state: GameState, connection: Connection): boolean {
  if (connection.doorId !== null && state.unlockedDoors.includes(connection.doorId)) return true;
  return evaluate(connection.traversableWhen, state);
}

export function isTraversable(world: WorldSpec, state: GameState, connection: Connection) {
  return blockersCleared(world, state, connection) && gateOpen(state, connection);
}

export function entitiesIn(world: WorldSpec, roomId: string): WorldEntity[] {
  return world.entities.filter((entity) => entity.roomId === roomId);
}
