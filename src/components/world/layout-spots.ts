import type { Disc, Point, RoomLayout } from "./layout-types.js";

const wallInset = 0.4;
const breathing = 0.12;
const ringStep = 0.3;
const ringCount = 24;
const spokes = 24;

export type Lane = { from: Point; to: Point; r: number };

function laneClearance(point: Point, radius: number, lane: Lane): number {
  const dx = lane.to[0] - lane.from[0];
  const dz = lane.to[1] - lane.from[1];
  const lengthSquared = dx * dx + dz * dz;
  const dot = (point[0] - lane.from[0]) * dx + (point[1] - lane.from[1]) * dz;
  const share = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, dot / lengthSquared));
  return (
    Math.hypot(point[0] - lane.from[0] - share * dx, point[1] - lane.from[1] - share * dz) -
    radius -
    lane.r
  );
}

function clearance(
  point: Point,
  radius: number,
  taken: readonly Disc[],
  lanes: readonly Lane[],
): number {
  const discs = taken.reduce(
    (least, disc) =>
      Math.min(least, Math.hypot(point[0] - disc.x, point[1] - disc.z) - disc.r - radius),
    Number.POSITIVE_INFINITY,
  );
  return lanes.reduce((least, lane) => Math.min(least, laneClearance(point, radius, lane)), discs);
}

function clampInside(room: RoomLayout, point: Point, radius: number): Point {
  const reach = Math.max(0, room.size / 2 - wallInset - radius);
  const clamp = (value: number, centre: number) =>
    Math.min(centre + reach, Math.max(centre - reach, value));
  return [clamp(point[0], room.center[0]), clamp(point[1], room.center[1])];
}

function candidates(room: RoomLayout, desired: Point, radius: number): Point[] {
  const points: Point[] = [clampInside(room, desired, radius)];
  for (let ring = 1; ring <= ringCount; ring += 1) {
    for (let spoke = 0; spoke < spokes; spoke += 1) {
      const angle = (spoke / spokes) * Math.PI * 2 + ring * 0.7;
      points.push(
        clampInside(
          room,
          [
            desired[0] + Math.cos(angle) * ring * ringStep,
            desired[1] + Math.sin(angle) * ring * ringStep,
          ],
          radius,
        ),
      );
    }
  }
  return points;
}

export function findFreeSpot(
  room: RoomLayout,
  desired: Point,
  radius: number,
  taken: readonly Disc[],
  lanes: readonly Lane[] = [],
): Point {
  let best: Point = clampInside(room, desired, radius);
  let bestClearance = Number.NEGATIVE_INFINITY;
  for (const point of candidates(room, desired, radius)) {
    const free = clearance(point, radius, taken, lanes);
    if (free >= breathing) return point;
    if (free > bestClearance) {
      best = point;
      bestClearance = free;
    }
  }
  return best;
}
