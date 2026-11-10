import { inwardPoint } from "./layout-rooms.js";
import type { CorridorLayout, Point, RoomLayout, SceneLayout } from "./layout-types.js";

export type Leg = { from: Point; to: Point; hidden: boolean };
export type Route = { legs: Leg[]; length: number };
export type Stride = { point: Point; heading: number; hidden: boolean };

const doorstep = 0.9;
const jumpLength = 2.4;

function legLength(leg: Leg): number {
  return leg.hidden ? jumpLength : Math.hypot(leg.to[0] - leg.from[0], leg.to[1] - leg.from[1]);
}

function routeOf(points: readonly Point[], hiddenIndex: number | null): Route {
  const legs = points.slice(1).map((to, index): Leg => {
    const from = points[index] ?? to;
    return { from, to, hidden: index === hiddenIndex };
  });
  return { legs, length: legs.reduce((total, leg) => total + legLength(leg), 0) };
}

function joins(corridor: CorridorLayout, a: string, b: string): boolean {
  return (
    (corridor.fromRoomId === a && corridor.toRoomId === b) ||
    (corridor.fromRoomId === b && corridor.toRoomId === a)
  );
}

function threshold(room: RoomLayout | undefined, point: Point): Point {
  return room === undefined ? point : inwardPoint(room, point, doorstep);
}

export function walkRoute(
  layout: SceneLayout,
  from: Point,
  fromRoomId: string,
  to: Point,
  toRoomId: string,
  openConnectionIds: ReadonlySet<string>,
): Route | null {
  if (fromRoomId === toRoomId) return routeOf([from, to], null);
  const options = layout.corridors.filter((corridor) => joins(corridor, fromRoomId, toRoomId));
  const corridor =
    options.find((option) => openConnectionIds.has(option.connectionId)) ?? options[0];
  if (corridor === undefined) return null;
  const forward = corridor.fromRoomId === fromRoomId;
  const exit = forward ? corridor.from : corridor.to;
  const entry = forward ? corridor.to : corridor.from;
  if (corridor.kind === "portal") return routeOf([from, exit, entry, to], 1);
  const rooms = new Map(layout.rooms.map((room) => [room.id, room]));
  return routeOf(
    [from, threshold(rooms.get(fromRoomId), exit), threshold(rooms.get(toRoomId), entry), to],
    null,
  );
}

export function stride(route: Route, distance: number): Stride {
  let remaining = Math.min(route.length, Math.max(0, distance));
  let last: Stride = { point: route.legs[0]?.from ?? [0, 0], heading: 0, hidden: false };
  for (const leg of route.legs) {
    const length = legLength(leg);
    const heading = Math.atan2(leg.to[0] - leg.from[0], leg.to[1] - leg.from[1]);
    if (length < 1e-6) continue;
    const share = Math.min(1, remaining / length);
    last = {
      point: [
        leg.from[0] + (leg.to[0] - leg.from[0]) * share,
        leg.from[1] + (leg.to[1] - leg.from[1]) * share,
      ],
      heading: leg.hidden ? last.heading : heading,
      hidden: leg.hidden && share > 0 && share < 1,
    };
    if (remaining <= length) return last;
    remaining -= length;
  }
  return last;
}
