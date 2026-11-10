import type { Room } from "../../../contract/world.schema.js";
import {
  arcPath,
  circlePath,
  linePath,
  rectPath,
  type Stroke,
  type StrokeTone,
  type Weight,
} from "./paths.js";

export const wall = 14;
export const slab = 12;
export const floor = 520;
export const doorHeight = 118;
const pilaster = 26;

export type Placed = { room: Room; left: number; right: number; top: number };

export type Opening = { kind: "open" | "door" | "portal"; doorId: string | null };

function stroke(
  id: string,
  d: string,
  weight: Weight,
  x: number,
  width: number,
  tone?: StrokeTone,
): Stroke {
  return tone === undefined
    ? { id, d, weight, start: x / width }
    : { id, d, weight, start: x / width, tone };
}

function glazing(id: string, left: number, top: number, w: number, h: number, width: number) {
  const bays = Math.max(2, Math.round(w / 34));
  const strokes = [
    stroke(`${id}-frame`, rectPath(left, top, w, h), "light", left, width),
    stroke(
      `${id}-transom`,
      linePath(left, top + h * 0.38, left + w, top + h * 0.38),
      "hair",
      left,
      width,
    ),
  ];
  for (let bay = 1; bay < bays; bay += 1) {
    const x = left + (w / bays) * bay;
    strokes.push(
      stroke(`${id}-mullion-${String(bay)}`, linePath(x, top, x, top + h), "hair", x, width),
    );
  }
  return strokes;
}

export function wallStrokes(
  x: number,
  top: number,
  opening: Opening | null,
  width: number,
): Stroke[] {
  const crown = top - slab - pilaster;
  if (opening === null)
    return [
      stroke(`wall-${String(x)}`, rectPath(x, crown, wall, floor - crown), "heavy", x, width),
    ];
  const lintel = floor - doorHeight;
  const strokes = [
    stroke(`wall-${String(x)}`, rectPath(x, crown, wall, lintel - crown), "heavy", x, width),
    stroke(`jamb-${String(x)}`, linePath(x - 8, lintel, x + wall + 8, lintel), "light", x, width),
  ];
  const center = x + wall / 2;
  if (opening.kind === "door") {
    strokes.push(
      stroke(
        `leaf-${String(x)}`,
        rectPath(center - 22, lintel + 6, 44, doorHeight - 6),
        "light",
        x,
        width,
        "door",
      ),
      stroke(
        `panel-${String(x)}`,
        rectPath(center - 15, lintel + 14, 30, doorHeight - 30),
        "hair",
        x,
        width,
        "door",
      ),
      stroke(
        `lock-${String(x)}`,
        circlePath(center + 14, floor - doorHeight / 2, 2.5),
        "light",
        x,
        width,
        "door",
      ),
    );
  }
  if (opening.kind === "portal") {
    const cy = floor - doorHeight / 2 - 2;
    strokes.push(
      stroke(
        `ring-${String(x)}`,
        circlePath(center, cy, doorHeight * 0.42),
        "light",
        x,
        width,
        "portal",
      ),
      stroke(
        `core-${String(x)}`,
        circlePath(center, cy, doorHeight * 0.28),
        "hair",
        x,
        width,
        "portal",
      ),
    );
  }
  return strokes;
}

export function roomStrokes({ room, left, right, top }: Placed, width: number): Stroke[] {
  const inner = right - left;
  const strokes = [
    stroke(
      `${room.id}-roof`,
      rectPath(left - wall - 8, top - slab, inner + 2 * wall + 16, slab),
      "heavy",
      left,
      width,
    ),
  ];
  const twoStorey = floor - top >= 230;
  const slabY = top + (floor - top) * 0.46;
  const upperBottom = twoStorey ? slabY - 16 : floor - doorHeight - 24;
  const upperWidth = inner * 0.72;
  strokes.push(
    ...glazing(
      `${room.id}-upper`,
      left + (inner - upperWidth) / 2,
      top + 20,
      upperWidth,
      upperBottom - top - 20,
      width,
    ),
  );
  if (twoStorey) {
    const lowerWidth = inner * 0.5;
    strokes.push(
      stroke(`${room.id}-slab`, rectPath(left, slabY, inner, 7), "light", left, width),
      ...glazing(
        `${room.id}-lower`,
        left + (inner - lowerWidth) / 2,
        slabY + 24,
        lowerWidth,
        floor - 104 - slabY - 24,
        width,
      ),
    );
  }
  return strokes;
}

export function domeStrokes({ left, right, top }: Placed, width: number): Stroke[] {
  const inner = right - left;
  const center = left + inner / 2;
  const radius = inner * 0.3;
  const drumTop = top - slab - 22;
  const x = center - radius;
  return [
    stroke(
      "dome-drum",
      rectPath(center - radius - 8, drumTop, 2 * radius + 16, 22),
      "light",
      x,
      width,
    ),
    stroke(
      "dome-shell",
      arcPath(center - radius, drumTop, center + radius, radius),
      "heavy",
      x,
      width,
    ),
    stroke(
      "dome-rib",
      arcPath(center - radius * 0.62, drumTop, center + radius * 0.62, radius * 0.62),
      "hair",
      x,
      width,
    ),
    stroke(
      "dome-slit-a",
      linePath(center - 7, drumTop - radius + 2, center - 7, drumTop),
      "light",
      x,
      width,
    ),
    stroke(
      "dome-slit-b",
      linePath(center + 7, drumTop - radius + 2, center + 7, drumTop),
      "light",
      x,
      width,
    ),
    stroke("dome-scope", rectPath(center - 4, drumTop - radius - 30, 8, 42), "light", x, width),
  ];
}
