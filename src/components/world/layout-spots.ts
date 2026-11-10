import type { Disc, Point, RoomLayout } from "./layout-types.js";

const wallInset = 0.4;
const ringStep = 0.3;
const ringCount = 24;
const spokes = 24;

function clearance(point: Point, radius: number, taken: readonly Disc[]): number {
  return taken.reduce(
    (least, disc) =>
      Math.min(least, Math.hypot(point[0] - disc.x, point[1] - disc.z) - disc.r - radius),
    Number.POSITIVE_INFINITY,
  );
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
): Point {
  let best: Point = clampInside(room, desired, radius);
  let bestClearance = Number.NEGATIVE_INFINITY;
  for (const point of candidates(room, desired, radius)) {
    const free = clearance(point, radius, taken);
    if (free >= 0) return point;
    if (free > bestClearance) {
      best = point;
      bestClearance = free;
    }
  }
  return best;
}
