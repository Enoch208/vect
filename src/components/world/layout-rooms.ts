import type { Connection, Room, WorldSpec } from "../../contract/world.schema.js";
import {
  gridToScene,
  roomSize,
  sideVector,
  type CorridorLayout,
  type Disc,
  type Point,
  type RoomLayout,
  type Side,
} from "./layout-types.js";
import { findFreeSpot } from "./layout-spots.js";

const laneSpacing = 2.2;
const padReach = 0.55;
export const padRadius = 1;
export const arrivalRadius = 0.75;
export const approachDepth = 0.8;

const opposite: Record<Side, Side> = { n: "s", s: "n", e: "w", w: "e" };

function sideBetween(from: Room, to: Room): Side | null {
  const dx = to.grid.x - from.grid.x;
  const dz = to.grid.z - from.grid.z;
  if (Math.abs(dx) + Math.abs(dz) !== 1) return null;
  if (dx !== 0) return dx > 0 ? "e" : "w";
  return dz > 0 ? "s" : "n";
}

function pairKey(connection: Connection): string {
  return [connection.fromRoomId, connection.toRoomId].sort().join("|");
}

function laneOffset(world: WorldSpec, connection: Connection): number {
  const lanes = world.connections.filter((other) => pairKey(other) === pairKey(connection));
  return (lanes.indexOf(connection) - (lanes.length - 1) / 2) * laneSpacing;
}

function openingPoint(room: RoomLayout, side: Side, offset: number): Point {
  const [vx, vz] = sideVector[side];
  const half = room.size / 2;
  return [
    room.center[0] + vx * half + Math.abs(vz) * offset,
    room.center[1] + vz * half + Math.abs(vx) * offset,
  ];
}

export function inwardPoint(room: RoomLayout, point: Point, depth: number): Point {
  const dx = room.center[0] - point[0];
  const dz = room.center[1] - point[1];
  const onX = Math.abs(dx) >= Math.abs(dz);
  return [
    point[0] + (onX ? Math.sign(dx) * depth : 0),
    point[1] + (onX ? 0 : Math.sign(dz) * depth),
  ];
}

export function reservedDiscs(room: RoomLayout): Disc[] {
  const lanes = room.openings.map((opening): Disc => {
    const [x, z] = inwardPoint(room, opening.point, approachDepth);
    return { x, z, r: approachDepth };
  });
  return [{ x: room.center[0], z: room.center[1], r: arrivalRadius }, ...lanes];
}

function isGated(world: WorldSpec, connection: Connection): boolean {
  const blocked = world.entities.some((entity) => entity.blocksConnectionId === connection.id);
  return blocked || connection.traversableWhen.op !== "true";
}

function gatePoint(
  world: WorldSpec,
  connection: Connection,
  from: Point,
  to: Point,
  linked: boolean,
): Point {
  if (connection.doorId === null && !linked) return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const door = world.entities.find((entity) => entity.id === connection.doorId);
  return door?.roomId === connection.fromRoomId ? from : to;
}

function padSpot(room: RoomLayout, toward: RoomLayout, pads: Disc[]): Point {
  const dx = toward.center[0] - room.center[0];
  const dz = toward.center[1] - room.center[1];
  const length = Math.hypot(dx, dz) || 1;
  const reach = (room.size / 2) * padReach;
  const desired: Point = [
    room.center[0] + (dx / length) * reach,
    room.center[1] + (dz / length) * reach,
  ];
  const spot = findFreeSpot(room, desired, padRadius, [...reservedDiscs(room), ...pads]);
  pads.push({ x: spot[0], z: spot[1], r: padRadius });
  return spot;
}

export type RoomPlan = {
  rooms: RoomLayout[];
  corridors: CorridorLayout[];
  pads: Map<string, Disc[]>;
};

export function planRooms(world: WorldSpec): RoomPlan {
  const rooms = world.rooms.map((room): RoomLayout => ({
    id: room.id,
    label: room.label,
    center: gridToScene(room.grid),
    size: roomSize[room.prefab],
    openings: [],
  }));
  const specs = new Map(world.rooms.map((room) => [room.id, room]));
  const layouts = new Map(rooms.map((room) => [room.id, room]));
  const pads = new Map<string, Disc[]>(rooms.map((room) => [room.id, []]));
  const joined: Array<{
    connection: Connection;
    from: RoomLayout;
    to: RoomLayout;
    side: Side | null;
  }> = [];
  for (const connection of world.connections) {
    const fromSpec = specs.get(connection.fromRoomId);
    const toSpec = specs.get(connection.toRoomId);
    const from = layouts.get(connection.fromRoomId);
    const to = layouts.get(connection.toRoomId);
    if (!fromSpec || !toSpec || !from || !to || from === to) continue;
    const side = sideBetween(fromSpec, toSpec);
    if (side !== null) {
      const offset = laneOffset(world, connection);
      from.openings.push({
        side,
        connectionId: connection.id,
        offset,
        point: openingPoint(from, side, offset),
      });
      to.openings.push({
        side: opposite[side],
        connectionId: connection.id,
        offset,
        point: openingPoint(to, opposite[side], offset),
      });
    }
    joined.push({ connection, from, to, side });
  }
  const corridors = joined.map(({ connection, from, to, side }): CorridorLayout => {
    const start =
      side === null
        ? padSpot(from, to, pads.get(from.id) ?? [])
        : openingPoint(from, side, laneOffset(world, connection));
    const end =
      side === null
        ? padSpot(to, from, pads.get(to.id) ?? [])
        : openingPoint(to, opposite[side], laneOffset(world, connection));
    return {
      connectionId: connection.id,
      kind: side === null ? "portal" : "corridor",
      from: start,
      to: end,
      fromRoomId: from.id,
      toRoomId: to.id,
      axis: side === "n" || side === "s" ? "z" : "x",
      gate: gatePoint(world, connection, start, end, side === null),
      gateEntityId: connection.doorId,
      gated: isGated(world, connection),
      conditional: connection.traversableWhen.op !== "true",
    };
  });
  return { rooms, corridors, pads };
}
