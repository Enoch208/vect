import type { WorldEntity } from "../../../contract/world.schema.js";
import { circlePath, linePath, rectPath, type Stroke } from "./paths.js";

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

export function entityStrokes(entity: WorldEntity, anchor: Anchor, width: number): Stroke[] {
  const glyph = glyphs[entity.kind];
  if (glyph === undefined) return [];
  const x = anchor.center + entity.localPosition.x * anchor.halfWidth * 0.7;
  const y = anchor.floor - 26 - entity.localPosition.y * anchor.height * 0.55;
  return glyph(x, y, anchor.floor).map((d, index) => ({
    id: `${entity.id}-${String(index)}`,
    d,
    weight: "light",
    start: x / width,
  }));
}

export function stairStrokes(right: number, floor: number, width: number): Stroke[] {
  const steps = 6;
  const rise = 11;
  const strokes: Stroke[] = [
    {
      id: "stair-block",
      d: rectPath(right - 112, floor - steps * rise, 112, steps * rise),
      weight: "light",
      start: (right - 112) / width,
    },
    {
      id: "stair-rail",
      d: linePath(right - 126, floor, right - 126, floor - steps * rise - 22),
      weight: "light",
      start: (right - 126) / width,
    },
    {
      id: "stair-cap",
      d: linePath(right - 132, floor - steps * rise - 22, right - 40, floor - steps * rise - 22),
      weight: "light",
      start: (right - 132) / width,
    },
  ];
  for (let step = 1; step < steps; step += 1) {
    const inset = step * 12;
    strokes.push({
      id: `stair-${String(step)}`,
      d: linePath(right - 112 + inset, floor - step * rise, right, floor - step * rise),
      weight: "hair",
      start: (right - 112 + inset) / width,
    });
  }
  return strokes;
}
