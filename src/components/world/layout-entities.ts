import type { EntityKind } from "../../contract/codes.js";
import type { WorldEntity, WorldSpec } from "../../contract/world.schema.js";
import { arrivalRadius, inwardPoint, reservedDiscs, type RoomPlan } from "./layout-rooms.js";
import { findFreeSpot } from "./layout-spots.js";
import {
  entitySpread,
  type CorridorLayout,
  type Disc,
  type EntityLayout,
  type Point,
  type RoomLayout,
} from "./layout-types.js";

const blockerDepth = 0.9;

export const footprint: Record<EntityKind, number> = {
  key: 0.5,
  switch: 0.55,
  barrier: 0.7,
  chest: 0.65,
  trap: 0.7,
  checkpoint: 0.6,
  goal: 1,
  prop: 0.7,
  door: 0.7,
  portal: 0.8,
};

function desiredSpot(room: RoomLayout, entity: WorldEntity): Point {
  const reach = (room.size / 2) * entitySpread;
  return [
    room.center[0] + entity.localPosition.x * reach,
    room.center[1] + entity.localPosition.z * reach,
  ];
}

function gateSpot(corridors: readonly CorridorLayout[], entity: WorldEntity): Point | null {
  return corridors.find((corridor) => corridor.gateEntityId === entity.id)?.gate ?? null;
}

function blockerSpot(room: RoomLayout, entity: WorldEntity): Point | null {
  const opening = room.openings.find((item) => item.connectionId === entity.blocksConnectionId);
  return opening === undefined ? null : inwardPoint(room, opening.point, blockerDepth);
}

function placed(entity: WorldEntity, spot: Point, radius: number): EntityLayout {
  return {
    id: entity.id,
    roomId: entity.roomId,
    position: [spot[0], 0, spot[1]],
    footprint: radius,
  };
}

function isArrivalDisc(room: RoomLayout, disc: Disc): boolean {
  return disc.x === room.center[0] && disc.z === room.center[1] && disc.r === arrivalRadius;
}

export function placeEntities(world: WorldSpec, plan: RoomPlan): EntityLayout[] {
  const rooms = new Map(plan.rooms.map((room) => [room.id, room]));
  const taken = new Map<string, Disc[]>(
    plan.rooms.map((room) => [
      room.id,
      [...reservedDiscs(room), ...(plan.pads.get(room.id) ?? [])],
    ]),
  );
  const fixed = new Map<string, EntityLayout>();
  for (const entity of world.entities) {
    const room = rooms.get(entity.roomId);
    const gate = gateSpot(plan.corridors, entity);
    if (gate !== null) fixed.set(entity.id, placed(entity, gate, 0));
    const spot = room === undefined || gate !== null ? null : blockerSpot(room, entity);
    if (spot === null) continue;
    fixed.set(entity.id, placed(entity, spot, footprint[entity.kind]));
    taken.get(entity.roomId)?.push({ x: spot[0], z: spot[1], r: footprint[entity.kind] });
  }
  const goalsFirst = [...world.entities].sort(
    (a, b) => Number(b.kind === "goal") - Number(a.kind === "goal"),
  );
  const free = new Map<string, EntityLayout>();
  for (const entity of goalsFirst) {
    const room = rooms.get(entity.roomId);
    if (room === undefined || fixed.has(entity.id)) continue;
    const discs = taken.get(room.id) ?? [];
    const radius = footprint[entity.kind];
    const avoid =
      entity.kind === "goal" ? discs.filter((disc) => !isArrivalDisc(room, disc)) : discs;
    const spot = findFreeSpot(room, desiredSpot(room, entity), radius, avoid);
    free.set(entity.id, placed(entity, spot, radius));
    discs.push({ x: spot[0], z: spot[1], r: radius });
  }
  return world.entities.flatMap((entity) => fixed.get(entity.id) ?? free.get(entity.id) ?? []);
}
