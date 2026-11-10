import type { Connection, WorldSpec } from "../contract/world.schema.js";
import { roomById } from "../domain/world-lookup.js";

export function reachableIgnoringGates(
  world: WorldSpec,
  from: readonly string[],
  avoid: ReadonlySet<string> = new Set(),
): Set<string> {
  const reached = new Set(from);
  const queue = [...from];
  for (let head = 0; head < queue.length; head++) {
    const roomId = queue[head];
    for (const connection of world.connections) {
      const next =
        connection.fromRoomId === roomId
          ? connection.toRoomId
          : connection.toRoomId === roomId
            ? connection.fromRoomId
            : null;
      if (next === null || reached.has(next) || avoid.has(next)) continue;
      if (roomById(world, next) === null) continue;
      reached.add(next);
      queue.push(next);
    }
  }
  return reached;
}

export type FrontierGate = { connection: Connection; inside: string; outside: string };

export function frontierOf(world: WorldSpec, reached: ReadonlySet<string>): FrontierGate[] {
  return world.connections.flatMap((connection) => {
    const fromIn = reached.has(connection.fromRoomId);
    const toIn = reached.has(connection.toRoomId);
    if (fromIn === toIn) return [];
    const inside = fromIn ? connection.fromRoomId : connection.toRoomId;
    const outside = fromIn ? connection.toRoomId : connection.fromRoomId;
    return roomById(world, outside) === null ? [] : [{ connection, inside, outside }];
  });
}
