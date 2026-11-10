import type { WorldEntity } from "../../../contract/world.schema.js";
import { circlePath, linePath, rectPath, type Stroke, type StrokeTone } from "./paths.js";

export type Anchor = { center: number; halfWidth: number; floor: number; height: number };

type Glyph = (x: number, y: number, floor: number) => string[];

const glyphs: Partial<Record<WorldEntity["kind"], Glyph>> = {
  key: (x, y) => [
    circlePath(x - 9, y, 6),
    linePath(x - 3, y, x + 15, y),
    linePath(x + 10, y, x + 10, y + 6),
    linePath(x + 15, y, x + 15, y + 7),
  ],
  switch: (x, y) => [
    rectPath(x - 7, y - 10, 14, 20),
    linePath(x, y + 2, x + 9, y - 12),
    circlePath(x + 9, y - 12, 2.5),
  ],
  chest: (x, _y, floor) => [
    rectPath(x - 16, floor - 20, 32, 20),
    linePath(x - 16, floor - 13, x + 16, floor - 13),
  ],
  barrier: (x, _y, floor) =>
    [0, 1, 2, 3].map((bar) => linePath(x - 12 + bar * 8, floor, x - 12 + bar * 8, floor - 46)),
  trap: (x, _y, floor) => [`M${String(x - 18)} ${String(floor)}l6 -8l6 8l6 -8l6 8l6 -8l6 8`],
  checkpoint: (x, _y, floor) => [`M${String(x)} ${String(floor - 34)}l10 12l-10 12l-10 -12Z`],
  goal: (x, _y, floor) => [
    linePath(x, floor, x, floor - 58),
    `M${String(x)} ${String(floor - 58)}l22 8l-22 8`,
  ],
  prop: (x, _y, floor) => [
    rectPath(x - 14, floor - 24, 28, 24),
    linePath(x - 20, floor - 24, x + 20, floor - 24),
    circlePath(x, floor - 34, 8),
  ],
};

const toneFor: Partial<Record<WorldEntity["kind"], StrokeTone>> = {
  key: "key",
  door: "door",
  portal: "portal",
  switch: "switch",
  goal: "goal",
};

export function entityStrokes(entity: WorldEntity, anchor: Anchor, width: number): Stroke[] {
  const glyph = glyphs[entity.kind];
  if (glyph === undefined) return [];
  const x = anchor.center + entity.localPosition.x * anchor.halfWidth * 0.7;
  const y = anchor.floor - 26 - entity.localPosition.y * anchor.height * 0.55;
  const tone = toneFor[entity.kind];
  return glyph(x, y, anchor.floor).map((d, index) =>
    tone === undefined
      ? { id: `${entity.id}-${String(index)}`, d, weight: "light", start: x / width }
      : { id: `${entity.id}-${String(index)}`, d, weight: "light", start: x / width, tone },
  );
}

export function playerStrokes(x: number, floorY: number, width: number): Stroke[] {
  const head = floorY - 78;
  const paths = [
    circlePath(x, head, 8),
    linePath(x, head + 8, x, floorY - 30),
    linePath(x, floorY - 58, x - 14, floorY - 44),
    linePath(x, floorY - 58, x + 16, floorY - 40),
    linePath(x, floorY - 30, x - 11, floorY),
    linePath(x, floorY - 30, x + 12, floorY),
  ];
  return paths.map((d, index) => ({
    id: `player-${String(index)}`,
    d,
    weight: "light",
    start: x / width,
    tone: "player",
  }));
}

export function stairStrokes(right: number, floorY: number, width: number): Stroke[] {
  const steps = 7;
  const rise = 9;
  const run = 14;
  const flight = steps * run;
  const parts = [`M${String(right - flight)} ${String(floorY)}`];
  for (let step = 0; step < steps; step += 1) {
    const x = right - flight + step * run;
    const y = floorY - (steps - step) * rise;
    parts.push(`V${String(y)}H${String(x + run)}`);
  }
  parts.push(`V${String(floorY)}`);
  const railX = right - flight - 16;
  const railTop = floorY - steps * rise - 18;
  return [
    {
      id: "stair-flight",
      d: parts.join(""),
      weight: "light",
      start: (right - flight) / width,
    },
    {
      id: "stair-rail",
      d: linePath(railX, floorY, railX, railTop),
      weight: "light",
      start: railX / width,
    },
    {
      id: "stair-cap",
      d: linePath(railX - 6, railTop, right - flight + 22, railTop),
      weight: "light",
      start: (railX - 6) / width,
    },
  ];
}
