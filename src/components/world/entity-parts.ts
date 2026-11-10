import type { Part } from "./parts.js";

const half = Math.PI / 2;

export const playerBody: readonly Part[] = [
  { shape: "cylinder", size: [0.31, 0.31, 0.7], at: [0, 0.78, 0] },
  { shape: "sphere", size: [0.31, 0, 0], at: [0, 0.43, 0] },
  { shape: "sphere", size: [0.31, 0, 0], at: [0, 1.13, 0] },
  { shape: "sphere", size: [0.26, 0, 0], at: [0, 1.76, 0] },
];

export const agentBody: readonly Part[] = [
  { shape: "cone", size: [0.4, 1, 0], at: [0, 0.5, 0], turn: [0, Math.PI / 4, 0], sides: 4 },
  { shape: "cone", size: [0.3, 0.3, 0], at: [0, 1.43, 0], sides: 4 },
  { shape: "cone", size: [0.3, 0.3, 0], at: [0, 1.13, 0], turn: [Math.PI, 0, 0], sides: 4 },
];

export const keyToken: readonly Part[] = [
  { shape: "torus", size: [0.2, 0.065, 0], at: [-0.2, 0, 0] },
  { shape: "box", size: [0.56, 0.1, 0.1], at: [0.26, 0, 0] },
  { shape: "box", size: [0.09, 0.16, 0.1], at: [0.34, -0.12, 0] },
  { shape: "box", size: [0.09, 0.16, 0.1], at: [0.5, -0.12, 0] },
];

export const pedestal: readonly Part[] = [
  { shape: "cylinder", size: [0.36, 0.41, 0.56], at: [0, 0.28, 0] },
];

export const switchBody: readonly Part[] = [
  { shape: "box", size: [0.84, 0.6, 0.56], at: [0, 0.3, 0] },
  { shape: "box", size: [0.6, 0.05, 0.3], at: [0, 0.625, 0] },
];

export const leverArm: readonly Part[] = [
  { shape: "box", size: [0.1, 0.68, 0.1], at: [0, 0.34, 0] },
];

export const chestBody: readonly Part[] = [
  { shape: "box", size: [1, 0.52, 0.66], at: [0, 0.26, 0] },
];

export const chestLid: readonly Part[] = [
  { shape: "box", size: [1.04, 0.18, 0.7], at: [0, 0.09, 0.33] },
];

export const barrierPosts: readonly Part[] = [
  { shape: "box", size: [0.18, 1.44, 0.18], at: [0, 0.72, -0.56] },
  { shape: "box", size: [0.18, 1.44, 0.18], at: [0, 0.72, 0] },
  { shape: "box", size: [0.18, 1.44, 0.18], at: [0, 0.72, 0.56] },
  { shape: "box", size: [0.1, 0.12, 1.5], at: [0, 1.1, 0] },
];

export const trapPlate: readonly Part[] = [
  { shape: "box", size: [1.16, 0.08, 1.16], at: [0, 0.05, 0] },
];

export const trapStripes: readonly Part[] = [-0.32, 0, 0.32].map((offset): Part => ({
  shape: "box",
  size: [0.12, 0.03, 0.86],
  at: [offset, 0.1, 0],
  turn: [0, 0.6, 0],
}));

export const checkpointBase: readonly Part[] = [
  { shape: "cylinder", size: [0.44, 0.5, 0.16], at: [0, 0.08, 0] },
];

export const checkpointPole: readonly Part[] = [
  { shape: "cylinder", size: [0.04, 0.04, 1.5], at: [0, 0.9, 0], sides: 8 },
];

export const checkpointFlag: readonly Part[] = [
  { shape: "box", size: [0.5, 0.32, 0.03], at: [0, 0, 0] },
];

export const goalRings: readonly Part[] = [
  { shape: "torus", size: [0.94, 0.035, 0], at: [0, 0.07, 0], turn: [half, 0, 0] },
  { shape: "torus", size: [0.62, 0.035, 0], at: [0, 0.07, 0], turn: [half, 0, 0] },
];

export const goalBase: readonly Part[] = [
  { shape: "cylinder", size: [0.2, 0.24, 0.14], at: [-0.72, 0.07, -0.72] },
];

export const goalFlag: readonly Part[] = [
  { shape: "cylinder", size: [0.035, 0.035, 2.9], at: [-0.72, 1.45, -0.72], sides: 8 },
  { shape: "box", size: [0.88, 0.58, 0.04], at: [-0.41, 2.6, -1.03], turn: [0, Math.PI / 4, 0] },
];

function bars(height: number, hung: boolean, width: number): readonly Part[] {
  return [
    ...[-0.62, -0.31, 0, 0.31, 0.62].map((offset): Part => ({
      shape: "box",
      size: [0.13, height, 0.13],
      at: [0, hung ? -height / 2 : height / 2, offset],
    })),
    { shape: "box", size: [0.09, 0.11, width], at: [0, hung ? -height * 0.5 : height * 0.72, 0] },
  ];
}

export const grilleBars = bars(1.8, true, 1.8);
export const corridorBars = bars(1.3, false, 1.8);
