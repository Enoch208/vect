import {
  sideVector,
  type Point,
  type RoomLayout,
  type SceneBounds,
  type Side,
} from "./layout-types.js";

export const wallWidth = 0.45;
export const gapWidth = 1.8;
export const viewMargin = 3;
export const roomTextSize = 0.75;
export const tagTextSize = 0.6;
export const glyphAdvance = 0.6;

export type Box = { x: number; z: number; w: number; h: number };

const sides: readonly Side[] = ["n", "s", "e", "w"];

export function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function coord(value: number): string {
  return String(round(value));
}

export function viewBoxOf(bounds: SceneBounds): Box {
  return {
    x: bounds.minX - viewMargin,
    z: bounds.minZ - viewMargin,
    w: bounds.maxX - bounds.minX + viewMargin * 2,
    h: bounds.maxZ - bounds.minZ + viewMargin * 2,
  };
}

export function shift(from: Point, direction: Point, distance: number): Point {
  return [from[0] + direction[0] * distance, from[1] + direction[1] * distance];
}

export function unit(from: Point, to: Point): Point {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const length = Math.hypot(dx, dz) || 1;
  return [dx / length, dz / length];
}

export function turn(direction: Point): Point {
  return [-direction[1], direction[0]];
}

export function flip(direction: Point): Point {
  return [-direction[0], -direction[1]];
}

export function samePoint(a: Point, b: Point): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function midpoint(a: Point, b: Point): Point {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function span(from: Point, to: Point, width: number): Box {
  const x = Math.min(from[0], to[0]);
  const z = Math.min(from[1], to[1]);
  const w = Math.abs(to[0] - from[0]);
  const h = Math.abs(to[1] - from[1]);
  return w >= h ? { x, z: z - width / 2, w, h: width } : { x: x - width / 2, z, w: width, h };
}

export function squareAt(centre: Point, reach: number): Box {
  return { x: centre[0] - reach, z: centre[1] - reach, w: reach * 2, h: reach * 2 };
}

function wallRuns(room: RoomLayout, side: Side): Array<[number, number]> {
  const lengthwise = side === "n" || side === "s";
  const centre = lengthwise ? room.center[0] : room.center[1];
  const reach = room.size / 2 + wallWidth / 2;
  const gaps = room.openings
    .filter((opening) => opening.side === side)
    .map((opening) => (lengthwise ? opening.point[0] : opening.point[1]))
    .sort((a, b) => a - b);
  const runs: Array<[number, number]> = [];
  let cursor = centre - reach;
  for (const gap of gaps) {
    if (gap - gapWidth / 2 > cursor) runs.push([cursor, gap - gapWidth / 2]);
    cursor = Math.max(cursor, gap + gapWidth / 2);
  }
  if (centre + reach > cursor) runs.push([cursor, centre + reach]);
  return runs;
}

export function wallBoxes(room: RoomLayout): Box[] {
  const half = room.size / 2;
  return sides.flatMap((side) => {
    const [vx, vz] = sideVector[side];
    return wallRuns(room, side).map(([from, to]): Box =>
      vz !== 0
        ? { x: from, z: room.center[1] + vz * half - wallWidth / 2, w: to - from, h: wallWidth }
        : { x: room.center[0] + vx * half - wallWidth / 2, z: from, w: wallWidth, h: to - from },
    );
  });
}

export function wallOutline(room: RoomLayout): string {
  const reach = room.size / 2 + wallWidth / 2;
  return sides
    .flatMap((side) => {
      const [vx, vz] = sideVector[side];
      return wallRuns(room, side).map(([from, to]) =>
        vz !== 0
          ? `M${coord(from)} ${coord(room.center[1] + vz * reach)}H${coord(to)}`
          : `M${coord(room.center[0] + vx * reach)} ${coord(from)}V${coord(to)}`,
      );
    })
    .join("");
}

export function boxPath(boxes: readonly Box[]): string {
  return boxes
    .map(
      (box) => `M${coord(box.x)} ${coord(box.z)}h${coord(box.w)}v${coord(box.h)}h${coord(-box.w)}z`,
    )
    .join("");
}

export function textWidth(text: string, size: number): number {
  return text.length * size * glyphAdvance;
}

export function clip(text: string, limit: number): string {
  const most = Math.max(1, Math.floor(limit));
  return text.length <= most ? text : `${text.slice(0, most - 1).trimEnd()}…`;
}

export function wrap(text: string, limit: number): string[] {
  const breaks = [...text.matchAll(/ /g)].map((found) => found.index);
  if (breaks.length === 0) return [clip(text, limit)];
  const middle = text.length / 2;
  const at = breaks.reduce((best, index) =>
    Math.abs(index - middle) < Math.abs(best - middle) ? index : best,
  );
  return [clip(text.slice(0, at), limit), clip(text.slice(at + 1), limit)];
}
