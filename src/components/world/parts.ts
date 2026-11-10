export type PartTone = "white" | "tint" | "fixture" | "ink";

export type PartShape = "box" | "cylinder" | "cone" | "sphere" | "dome" | "torus";

export type Part = {
  shape: PartShape;
  size: [number, number, number];
  at: [number, number, number];
  turn?: [number, number, number];
  tone?: PartTone;
  sides?: number;
};

export type PartInstance = {
  parts: readonly Part[];
  position: [number, number, number];
  turn: number;
};

export type PropSet = {
  variants: Record<string, readonly Part[]>;
  keywords: Record<string, readonly string[]>;
};

export const propLimits = { radius: 0.7, height: 2.4 } as const;

export function partReach(part: Part): { radius: number; top: number } {
  const [a, b, c] = part.size;
  const spread: Record<PartShape, number> = {
    box: Math.hypot(a, c) / 2,
    cylinder: Math.max(a, b),
    cone: a,
    sphere: a,
    dome: a,
    torus: a + b,
  };
  const rise: Record<PartShape, number> = {
    box: b / 2,
    cylinder: c / 2,
    cone: b / 2,
    sphere: a,
    dome: a,
    torus: a + b,
  };
  return {
    radius: Math.hypot(part.at[0], part.at[2]) + spread[part.shape],
    top: part.at[1] + rise[part.shape],
  };
}
