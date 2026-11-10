import type { WorldSpec } from "../../../contract/world.schema.js";
import {
  layoutWorld,
  type CorridorLayout,
  type Point,
  type RoomLayout,
  type SceneLayout,
} from "../../world/layout.js";

export const wallWidth = 0.45;
export const gapWidth = 1.8;
const margin = 3;
const dimensionBand = 4;

export type Rect = { x: number; z: number; w: number; h: number };
export type Box = { x: number; z: number; w: number; h: number };

export type PlanGeometry = {
  layout: SceneLayout;
  view: Box;
  walls: Array<{ roomId: string; rects: Rect[] }>;
};

function sideRects(room: RoomLayout): Rect[] {
  const half = room.size / 2;
  const [cx, cz] = room.center;
  const t = wallWidth;
  const runs: Array<{ side: "n" | "s" | "e" | "w"; from: number; to: number; fixed: number }> = [
    { side: "n", from: cx - half - t / 2, to: cx + half + t / 2, fixed: cz - half },
    { side: "s", from: cx - half - t / 2, to: cx + half + t / 2, fixed: cz + half },
    { side: "w", from: cz - half + t / 2, to: cz + half - t / 2, fixed: cx - half },
    { side: "e", from: cz - half + t / 2, to: cz + half - t / 2, fixed: cx + half },
  ];
  return runs.flatMap((run) => {
    const cuts = room.openings
      .filter((opening) => opening.side === run.side)
      .map((opening) =>
        run.side === "n" || run.side === "s" ? opening.point[0] : opening.point[1],
      )
      .sort((a, b) => a - b);
    const pieces: Array<[number, number]> = [];
    let start = run.from;
    for (const cut of cuts) {
      pieces.push([start, cut - gapWidth / 2]);
      start = cut + gapWidth / 2;
    }
    pieces.push([start, run.to]);
    return pieces
      .filter(([a, b]) => b - a > 0.01)
      .map(([a, b]) =>
        run.side === "n" || run.side === "s"
          ? { x: a, z: run.fixed - t / 2, w: b - a, h: t }
          : { x: run.fixed - t / 2, z: a, w: t, h: b - a },
      );
  });
}

export function planGeometry(world: WorldSpec): PlanGeometry {
  const layout = layoutWorld(world);
  const { bounds } = layout;
  const view = {
    x: bounds.minX - margin,
    z: bounds.minZ - margin - dimensionBand,
    w: bounds.maxX - bounds.minX + 2 * margin,
    h: bounds.maxZ - bounds.minZ + 2 * margin + dimensionBand,
  };
  const walls = layout.rooms.map((room) => ({ roomId: room.id, rects: sideRects(room) }));
  return { layout, view, walls };
}

export function corridorSides(corridor: CorridorLayout): Array<[Point, Point]> {
  const offset = gapWidth / 2;
  if (corridor.axis === "x") {
    return [
      [
        [corridor.from[0], corridor.from[1] - offset],
        [corridor.to[0], corridor.to[1] - offset],
      ],
      [
        [corridor.from[0], corridor.from[1] + offset],
        [corridor.to[0], corridor.to[1] + offset],
      ],
    ];
  }
  return [
    [
      [corridor.from[0] - offset, corridor.from[1]],
      [corridor.to[0] - offset, corridor.to[1]],
    ],
    [
      [corridor.from[0] + offset, corridor.from[1]],
      [corridor.to[0] + offset, corridor.to[1]],
    ],
  ];
}

export function roomOf(layout: SceneLayout, roomId: string): RoomLayout | undefined {
  return layout.rooms.find((room) => room.id === roomId);
}

export function pointOf(layout: SceneLayout, targetId: string): Point | null {
  const room = roomOf(layout, targetId);
  if (room !== undefined) return room.center;
  const corridor = layout.corridors.find(
    (item) => item.connectionId === targetId || item.gateEntityId === targetId,
  );
  if (corridor !== undefined) return corridor.gate;
  const entity = layout.entities.find((item) => item.id === targetId);
  return entity === undefined ? null : [entity.position[0], entity.position[2]];
}

export function roomView(
  layout: SceneLayout,
  roomId: string,
  pad: number,
  include: Point | null = null,
): Box | null {
  const room = roomOf(layout, roomId);
  if (room === undefined) return null;
  const half = room.size / 2;
  const minX = Math.min(room.center[0] - half, include?.[0] ?? Infinity) - pad;
  const maxX = Math.max(room.center[0] + half, include?.[0] ?? -Infinity) + pad;
  const minZ = Math.min(room.center[1] - half, include?.[1] ?? Infinity) - pad;
  const maxZ = Math.max(room.center[1] + half, include?.[1] ?? -Infinity) + pad;
  const side = Math.max(maxX - minX, maxZ - minZ);
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  return { x: cx - side / 2, z: cz - side / 2, w: side, h: side };
}
