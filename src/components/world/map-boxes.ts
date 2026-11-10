import type { Disc, RoomLayout } from "./layout-types.js";
import { wallWidth, type Box } from "./map-geometry.js";

export type Zones = { hard: Box[]; soft: Box[] };

const roomInset = wallWidth / 2 + 0.3;
const clearGap = 0.2;
const gridStep = 0.3;
const tolerance = 0.01;
const slack = 1e-6;
const driftWeight = 0.05;
const aboveBias = 0.05;

function overlap(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.z + a.h, b.z + b.h) - Math.max(a.z, b.z);
  return w > 0 && h > 0 ? w * h : 0;
}

function blocked(box: Box, taken: readonly Box[]): number {
  return taken.reduce((sum, other) => sum + overlap(box, other), 0);
}

export function settle<T extends { box: Box }>(options: readonly T[], zones: Zones): T | null {
  const everything = [...zones.hard, ...zones.soft];
  return (
    options.find((option) => blocked(option.box, everything) <= tolerance) ??
    options.find((option) => blocked(option.box, zones.hard) <= tolerance) ??
    null
  );
}

export function leastBlocked<T extends { box: Box }>(
  options: readonly T[],
  zones: Zones,
): T | null {
  let best: T | null = null;
  let least = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const cost = blocked(option.box, zones.hard);
    if (cost < least) {
      best = option;
      least = cost;
    }
  }
  return best;
}

export function innerBox(room: RoomLayout): Box {
  const reach = room.size / 2 - roomInset;
  return { x: room.center[0] - reach, z: room.center[1] - reach, w: reach * 2, h: reach * 2 };
}

export function corners(room: RoomLayout, w: number, h: number, drop: number): Box[] {
  const inner = innerBox(room);
  const right = inner.x + inner.w - w;
  const bottom = inner.z + inner.h - h;
  return [
    { x: inner.x, z: inner.z + drop, w, h },
    { x: right, z: inner.z + drop, w, h },
    { x: inner.x, z: bottom - drop, w, h },
    { x: right, z: bottom - drop, w, h },
  ];
}

function stops(from: number, to: number, extras: readonly number[]): number[] {
  const count = Math.max(0, Math.floor((to - from) / gridStep));
  const grid = Array.from({ length: count + 1 }, (_, index) => from + index * gridStep);
  return [...grid, to, ...extras].filter((value) => value >= from - slack && value <= to + slack);
}

function separation(spot: Disc, box: Box): number {
  const dx = Math.max(box.x - spot.x, 0, spot.x - box.x - box.w);
  const dz = Math.max(box.z - spot.z, 0, spot.z - box.z - box.h);
  return Math.hypot(dx, dz) - spot.r;
}

export function nearby(room: RoomLayout, spot: Disc, w: number, h: number, reach: number): Box[] {
  const inner = innerBox(room);
  const near = spot.r + clearGap;
  const xs = stops(inner.x, inner.x + inner.w - w, [
    spot.x - w / 2,
    spot.x + near,
    spot.x - near - w,
  ]);
  const zs = stops(inner.z, inner.z + inner.h - h, [
    spot.z + near,
    spot.z - near - h,
    spot.z - h / 2,
  ]);
  const ranked: Array<{ box: Box; rank: number }> = [];
  for (const z of zs) {
    for (const x of xs) {
      const box = { x, z, w, h };
      const gap = separation(spot, box);
      if (gap < clearGap - slack || gap > reach) continue;
      const drift = Math.min(Math.abs(x + w / 2 - spot.x), Math.abs(z + h / 2 - spot.z));
      ranked.push({ box, rank: gap + drift * driftWeight + (z < spot.z ? aboveBias : 0) });
    }
  }
  return ranked.sort((a, b) => a.rank - b.rank).map((item) => item.box);
}
