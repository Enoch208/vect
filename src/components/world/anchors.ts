import type { GameState } from "../../contract/game.schema.js";
import type { Room, WorldSpec } from "../../contract/world.schema.js";
import { isInteractive } from "../../domain/world-lookup.js";
import {
  entityReach,
  entitySpread,
  gridToScene,
  type EntityLayout,
  type Point,
  type SceneLayout,
} from "./layout-types.js";

const standOff = 0.75;
const epsilon = 1e-6;

type GridPoint = { x: number; z: number };

function roomFor(world: WorldSpec, point: GridPoint, roomId: string | null): Room | null {
  if (roomId !== null) return world.rooms.find((room) => room.id === roomId) ?? null;
  const cell = { x: Math.round(point.x), z: Math.round(point.z) };
  return world.rooms.find((room) => room.grid.x === cell.x && room.grid.z === cell.z) ?? null;
}

function beside(centre: Point, entity: EntityLayout): Point {
  const dx = centre[0] - entity.position[0];
  const dz = centre[1] - entity.position[2];
  const distance = Math.hypot(dx, dz);
  const gap = entity.footprint + standOff;
  if (distance <= gap) return centre;
  return [entity.position[0] + (dx / distance) * gap, entity.position[2] + (dz / distance) * gap];
}

export function sceneFromGrid(
  world: WorldSpec,
  layout: SceneLayout,
  point: GridPoint,
  roomId: string | null = null,
): Point {
  const room = roomFor(world, point, roomId);
  const placed = layout.rooms.find((item) => item.id === room?.id);
  if (room === null || placed === undefined) return gridToScene(point);
  const local = {
    x: (point.x - room.grid.x) / entityReach,
    z: (point.z - room.grid.z) / entityReach,
  };
  if (Math.hypot(local.x, local.z) < epsilon) return placed.center;
  const used = world.entities.find(
    (entity) =>
      entity.roomId === room.id &&
      isInteractive(entity) &&
      Math.abs(entity.localPosition.x - local.x) < epsilon &&
      Math.abs(entity.localPosition.z - local.z) < epsilon,
  );
  const spot = layout.entities.find((item) => item.id === used?.id);
  if (spot !== undefined) return beside(placed.center, spot);
  const reach = (placed.size / 2) * entitySpread;
  return [placed.center[0] + local.x * reach, placed.center[1] + local.z * reach];
}

export function actorAnchor(world: WorldSpec, layout: SceneLayout, state: GameState): Point {
  return sceneFromGrid(world, layout, state.position, state.currentRoomId);
}

export function pathAnchors(
  world: WorldSpec,
  layout: SceneLayout,
  path: ReadonlyArray<GridPoint>,
): Point[] {
  return path.map((point) => sceneFromGrid(world, layout, point));
}
