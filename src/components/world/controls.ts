import type { GameState } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { adjacentRoomIds, entitiesIn, isInteractive, roomById } from "../../domain/world-lookup.js";
import { actorAnchor } from "./anchors.js";
import { sideVector, type SceneLayout, type Side } from "./layout-types.js";

const keyDirections: Record<string, Side> = {
  KeyW: "n",
  ArrowUp: "n",
  KeyS: "s",
  ArrowDown: "s",
  KeyA: "w",
  ArrowLeft: "w",
  KeyD: "e",
  ArrowRight: "e",
};

export function keyDirection(code: string): Side | null {
  return keyDirections[code] ?? null;
}

export function directionTarget(world: WorldSpec, roomId: string, direction: Side): string | null {
  const room = roomById(world, roomId);
  if (room === null) return null;
  const [vx, vz] = sideVector[direction];
  const reachable = adjacentRoomIds(world, roomId).flatMap((id) => {
    const other = roomById(world, id);
    if (other === null) return [];
    const dx = other.grid.x - room.grid.x;
    const dz = other.grid.z - room.grid.z;
    const along = dx * vx + dz * vz;
    const across = Math.abs(dx * vz) + Math.abs(dz * vx);
    return along > 0 && along >= across ? [{ id, along, across }] : [];
  });
  reachable.sort((a, b) => a.across - b.across || a.along - b.along || a.id.localeCompare(b.id));
  return reachable[0]?.id ?? null;
}

export function nearestUsable(
  world: WorldSpec,
  layout: SceneLayout,
  state: GameState,
): string | null {
  const [x, z] = actorAnchor(world, layout, state);
  const usable = entitiesIn(world, state.currentRoomId)
    .filter((entity) => isInteractive(entity) && !state.collectedEntities.includes(entity.id))
    .flatMap((entity) => {
      const spot = layout.entities.find((item) => item.id === entity.id);
      if (spot === undefined) return [];
      return [{ id: entity.id, distance: Math.hypot(spot.position[0] - x, spot.position[2] - z) }];
    });
  usable.sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
  return usable[0]?.id ?? null;
}
