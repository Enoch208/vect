import type { WorldSpec } from "../../contract/world.schema.js";
import { placeEntities } from "./layout-entities.js";
import { planRooms } from "./layout-rooms.js";
import type { RoomLayout, SceneBounds, SceneLayout } from "./layout-types.js";

export {
  cellSize,
  gridToScene,
  roomSize,
  type CorridorLayout,
  type EntityLayout,
  type Opening,
  type Point,
  type RoomLayout,
  type SceneBounds,
  type SceneLayout,
  type Side,
} from "./layout-types.js";

function boundsOf(rooms: readonly RoomLayout[]): SceneBounds {
  return rooms.reduce<SceneBounds>(
    (bounds, room) => ({
      minX: Math.min(bounds.minX, room.center[0] - room.size / 2),
      maxX: Math.max(bounds.maxX, room.center[0] + room.size / 2),
      minZ: Math.min(bounds.minZ, room.center[1] - room.size / 2),
      maxZ: Math.max(bounds.maxZ, room.center[1] + room.size / 2),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minZ: Number.POSITIVE_INFINITY,
      maxZ: Number.NEGATIVE_INFINITY,
    },
  );
}

export function layoutWorld(world: WorldSpec): SceneLayout {
  const plan = planRooms(world);
  return {
    rooms: plan.rooms,
    corridors: plan.corridors,
    entities: placeEntities(world, plan),
    bounds: boundsOf(plan.rooms),
  };
}
