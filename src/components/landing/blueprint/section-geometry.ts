import type { Prefab } from "../../../contract/codes.js";
import type { Room, WorldSpec } from "../../../contract/world.schema.js";
import { linePath, type DrawingLabel, type Stroke } from "./paths.js";
import {
  domeStrokes,
  floor,
  roomStrokes,
  wall,
  wallStrokes,
  type Opening,
  type Placed,
} from "./section-parts.js";
import { entityStrokes, stairStrokes } from "./section-symbols.js";

export type RoomFrame = { id: string; left: number; right: number; top: number; floor: number };

export type SectionDrawing = {
  width: number;
  height: number;
  strokes: Stroke[];
  labels: DrawingLabel[];
  rooms: RoomFrame[];
};

const volume: Record<Prefab, { width: number; height: number }> = {
  small: { width: 180, height: 196 },
  medium: { width: 236, height: 240 },
  large: { width: 300, height: 276 },
};

const margin = 200;

function place(rooms: readonly Room[]): Placed[] {
  const ordered = [...rooms].sort((a, b) => a.grid.x - b.grid.x || a.grid.z - b.grid.z);
  let cursor = margin + wall;
  return ordered.map((room) => {
    const size = volume[room.prefab];
    const placed = { room, left: cursor, right: cursor + size.width, top: floor - size.height };
    cursor += size.width + wall;
    return placed;
  });
}

function openingBetween(world: WorldSpec, a: Room, b: Room): Opening | null {
  const link = world.connections.find(
    (item) =>
      (item.fromRoomId === a.id && item.toRoomId === b.id) ||
      (item.fromRoomId === b.id && item.toRoomId === a.id),
  );
  if (link === undefined) return null;
  if (link.doorId === null) return { kind: "open", doorId: null };
  const gate = world.entities.find((item) => item.id === link.doorId);
  return { kind: gate?.kind === "portal" ? "portal" : "door", doorId: link.doorId };
}

function doorTag(x: number, doorId: string, width: number): [Stroke, DrawingLabel] {
  return [
    {
      id: `leader-${doorId}`,
      d: linePath(x, floor + 6, x, floor + 40),
      weight: "hair",
      start: x / width,
    },
    { id: `tag-${doorId}`, x, y: floor + 54, text: doorId, anchor: "middle", start: x / width },
  ];
}

export function sectionDrawing(world: WorldSpec): SectionDrawing {
  const rooms = place(world.rooms);
  const first = rooms[0];
  const last = rooms.at(-1);
  if (first === undefined || last === undefined) {
    return { width: 0, height: 0, strokes: [], labels: [], rooms: [] };
  }
  const width = last.right + wall + margin;
  const strokes: Stroke[] = [
    { id: "ground", d: linePath(40, floor, width - 40, floor), weight: "light", start: 0 },
    ...stairStrokes(first.left - wall, floor, width),
  ];
  const labels: DrawingLabel[] = [];
  rooms.forEach((placed, index) => {
    const previous = rooms[index - 1];
    const opening =
      previous === undefined ? null : openingBetween(world, previous.room, placed.room);
    const wallTop = previous === undefined ? placed.top : Math.min(placed.top, previous.top);
    const wallX = placed.left - wall;
    strokes.push(...wallStrokes(wallX, wallTop, opening, width), ...roomStrokes(placed, width));
    if (opening?.doorId != null) {
      const [leader, tag] = doorTag(wallX + wall / 2, opening.doorId, width);
      strokes.push(leader);
      labels.push(tag);
    }
    const center = (placed.left + placed.right) / 2;
    labels.push({
      id: `room-${placed.room.id}`,
      x: center,
      y: floor + 26,
      text: placed.room.label,
      anchor: "middle",
      start: placed.left / width,
    });
    const anchor = {
      center,
      halfWidth: (placed.right - placed.left) / 2,
      floor,
      height: floor - placed.top,
    };
    for (const entity of world.entities.filter((item) => item.roomId === placed.room.id)) {
      strokes.push(...entityStrokes(entity, anchor, width));
    }
  });
  strokes.push(...wallStrokes(last.right, last.top, null, width));
  if (world.theme === "observatory") {
    const tallest = rooms.reduce((best, item) => (item.top < best.top ? item : best), first);
    strokes.push(...domeStrokes(tallest, width));
  }
  const frames = rooms.map(({ room, left, right, top }) => ({
    id: room.id,
    left,
    right,
    top,
    floor,
  }));
  return { width, height: floor + 70, strokes, labels, rooms: frames };
}
