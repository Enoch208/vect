import type { Connection, WorldSpec } from "../contract/world.schema.js";
import { entityById, roomById } from "../domain/world-lookup.js";

export function roomLabel(world: WorldSpec, roomId: string): string {
  return roomById(world, roomId)?.label ?? `"${roomId}"`;
}

export function entityLabel(world: WorldSpec, entityId: string): string {
  return entityById(world, entityId)?.label ?? `"${entityId}"`;
}

export function wayLabel(world: WorldSpec, connection: Connection): string {
  return `the way between ${roomLabel(world, connection.fromRoomId)} and ${roomLabel(world, connection.toRoomId)}`;
}

export function sentence(text: string): string {
  const trimmed = text.trim();
  const capital = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const ended = /[.!?]$/.test(capital) ? capital : `${capital}.`;
  return ended.length <= 400 ? ended : `${ended.slice(0, 396)}...`;
}
