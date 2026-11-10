import type { Part, PartShape, PropSet } from "../parts.js";

type Triple = [number, number, number];
type Finish = Pick<Part, "turn" | "tone" | "sides">;
type Maker = (size: Triple, at: Triple, finish?: Finish) => Part;

function maker(shape: PartShape): Maker {
  return (size, at, finish = {}) => ({ shape, size, at, ...finish });
}

const box = maker("box");
const rod = maker("cylinder");
const ball = maker("sphere");
const ring = maker("torus");

const quarter = Math.PI / 2;
const aim: Triple = [0, 0, -0.96];
const slope: Triple = [0.38, 0, 0];
const flat: Triple = [0, 0, quarter];
const skyward: Triple = [0, 0, -0.559];
const orbit: Triple = [quarter - 0.2, 0, 0];
const lean: Triple = [quarter - 0.2, 0, 0];

export const observatoryProps: PropSet = {
  variants: {
    telescope: [
      rod([0.36, 0.36, 0.08], [0, 0.04, 0], { tone: "tint", sides: 8 }),
      rod([0.1, 0.16, 0.9], [0, 0.53, 0], { sides: 8 }),
      box([0.26, 0.08, 0.42], [0, 1.02, 0], { tone: "fixture" }),
      box([0.2, 0.34, 0.06], [0, 1.22, 0.16], { tone: "fixture" }),
      box([0.2, 0.34, 0.06], [0, 1.22, -0.16], { tone: "fixture" }),
      rod([0.12, 0.12, 1.2], [0.04, 1.3, 0], { turn: aim }),
      rod([0.15, 0.15, 0.24], [0.45, 1.587, 0], { turn: aim, tone: "tint" }),
      rod([0.12, 0.12, 0.02], [0.552, 1.659, 0], { turn: aim, tone: "ink" }),
      rod([0.075, 0.075, 0.14], [-0.492, 0.927, 0], { turn: aim, tone: "fixture" }),
      rod([0.05, 0.05, 0.12], [-0.582, 0.864, 0], { turn: aim, tone: "ink" }),
      rod([0.04, 0.04, 0.4], [0.071, 1.517, 0], { turn: aim, tone: "fixture" }),
    ],
    orrery: [
      rod([0.34, 0.34, 0.07], [0, 0.035, 0], { tone: "tint" }),
      rod([0.05, 0.08, 1.05], [0, 0.595, 0]),
      ball([0.16, 0, 0], [0, 1.25, 0]),
      ring([0.28, 0.014, 0], [0, 1.25, 0], { turn: orbit }),
      ring([0.44, 0.014, 0], [0, 1.25, 0], { turn: orbit }),
      ring([0.6, 0.014, 0], [0, 1.25, 0], { turn: orbit }),
      rod([0.02, 0.02, 1.2], [0, 1.25, 0], { turn: flat, tone: "fixture" }),
      ball([0.06, 0, 0], [0.28, 1.25, 0], { tone: "fixture" }),
      ball([0.085, 0, 0], [0, 1.338, 0.431], { tone: "tint" }),
      ball([0.07, 0, 0], [-0.6, 1.25, 0], { tone: "ink" }),
    ],
    console: [
      box([0.94, 0.08, 0.62], [0, 0.04, 0], { tone: "tint" }),
      box([0.88, 0.62, 0.54], [0, 0.39, 0]),
      box([0.82, 0.3, 0.56], [0, 0.718, -0.025], { turn: slope }),
      box([0.82, 0.34, 0.1], [0, 1.08, -0.29]),
      box([0.56, 0.2, 0.02], [0, 1.1, -0.235], { tone: "tint" }),
      box([0.2, 0.04, 0.2], [-0.24, 0.894, -0.008], { turn: slope, tone: "fixture" }),
      box([0.3, 0.03, 0.14], [0.16, 0.908, -0.057], { turn: slope, tone: "ink" }),
      box([0.12, 0.08, 0.08], [0.1, 0.843, 0.175], { turn: slope, tone: "tint" }),
      box([0.08, 0.08, 0.08], [0.28, 0.843, 0.175], { turn: slope, tone: "tint" }),
      rod([0.05, 0.05, 0.06], [-0.24, 0.833, 0.172], { turn: slope, tone: "fixture" }),
    ],
    shelf: [
      box([1.0, 0.1, 0.46], [0, 0.05, 0], { tone: "tint" }),
      box([0.06, 1.9, 0.42], [-0.47, 1.05, 0]),
      box([0.06, 1.9, 0.42], [0.47, 1.05, 0]),
      box([0.88, 1.9, 0.04], [0, 1.05, 0]),
      box([1.04, 0.07, 0.48], [0, 2.035, 0], { tone: "tint" }),
      box([0.88, 0.04, 0.4], [0, 0.56, 0]),
      box([0.88, 0.04, 0.4], [0, 1.03, 0]),
      box([0.88, 0.04, 0.4], [0, 1.5, 0]),
      box([0.52, 0.34, 0.34], [-0.18, 0.27, 0], { tone: "tint" }),
      box([0.24, 0.16, 0.34], [0.3, 0.18, 0], { tone: "fixture" }),
      box([0.36, 0.3, 0.34], [0.26, 0.73, 0], { tone: "fixture" }),
      rod([0.065, 0.065, 0.62], [-0.1, 1.115, 0.1], { turn: flat }),
      rod([0.065, 0.065, 0.62], [-0.1, 1.115, -0.1], { turn: flat }),
      box([0.4, 0.3, 0.34], [-0.24, 1.67, 0], { tone: "tint" }),
    ],
    globe: [
      box([0.62, 0.1, 0.62], [0, 0.05, 0], { tone: "tint" }),
      rod([0.09, 0.14, 0.5], [0, 0.35, 0], { sides: 8 }),
      rod([0.24, 0.1, 0.14], [0, 0.67, 0], { tone: "fixture" }),
      ball([0.38, 0, 0], [0, 1.16, 0]),
      ring([0.56, 0.016, 0], [0, 1.16, 0], { turn: [quarter - 0.24, 0, 0] }),
      rod([0.02, 0.02, 1.08], [0, 1.16, 0], { turn: [-0.24, 0, 0], tone: "ink" }),
      ball([0.05, 0, 0], [0, 1.684, -0.129], { tone: "fixture" }),
    ],
    dish: [
      box([0.6, 0.1, 0.6], [0, 0.05, 0], { tone: "tint" }),
      rod([0.06, 0.13, 1.3], [0, 0.75, 0], { sides: 4 }),
      box([0.2, 0.2, 0.2], [0, 1.45, 0], { tone: "fixture" }),
      rod([0.5, 0.16, 0.2], [0.06, 1.6, 0], { turn: skyward }),
      rod([0.43, 0.43, 0.02], [0.116, 1.69, 0], { turn: skyward, tone: "tint" }),
      rod([0.022, 0.022, 0.4], [0.219, 1.855, 0], { turn: skyward }),
      ball([0.06, 0, 0], [0.336, 2.041, 0], { tone: "ink" }),
    ],
    charts: [
      box([0.08, 0.62, 0.56], [-0.42, 0.31, 0]),
      box([0.08, 0.62, 0.56], [0.42, 0.31, 0]),
      box([0.8, 0.05, 0.52], [0, 0.2, 0], { tone: "tint" }),
      box([1.16, 0.07, 0.74], [0, 0.655, 0]),
      box([0.74, 0.02, 0.54], [-0.12, 0.7, 0.02], { turn: [0, 0.14, 0], tone: "tint" }),
      rod([0.06, 0.06, 0.64], [0.42, 0.75, 0], { turn: [quarter, 0, 0.1] }),
      rod([0.045, 0.045, 0.5], [0.3, 0.735, 0.06], { turn: [quarter, 0, -0.14] }),
      rod([0.06, 0.06, 0.72], [0, 0.285, -0.1], { turn: flat }),
      rod([0.06, 0.06, 0.72], [0, 0.285, 0.05], { turn: flat }),
      rod([0.06, 0.06, 0.72], [0, 0.385, -0.025], { turn: flat }),
      box([0.09, 0.06, 0.09], [-0.3, 0.74, 0.14], { tone: "ink" }),
    ],
    lens: [
      box([1.3, 0.1, 0.4], [0, 0.05, 0], { tone: "tint" }),
      box([0.08, 1.3, 0.16], [-0.6, 0.75, 0]),
      box([0.08, 1.3, 0.16], [0.6, 0.75, 0]),
      rod([0.54, 0.54, 0.1], [0, 1.32, 0], { turn: lean }),
      rod([0.46, 0.46, 0.13], [0, 1.32, 0], { turn: lean, tone: "tint" }),
      rod([0.05, 0.05, 0.06], [-0.66, 1.32, 0], { turn: flat, tone: "ink" }),
      rod([0.05, 0.05, 0.06], [0.66, 1.32, 0], { turn: flat, tone: "ink" }),
    ],
  },
  keywords: {
    telescope: ["telescope", "scope", "spyglass", "refractor"],
    orrery: ["orrery", "planet", "orbit", "solar", "armillary"],
    console: ["console", "terminal", "panel", "desk", "computer", "control"],
    shelf: ["shelf", "shelv", "book", "archive", "library"],
    globe: ["globe", "sphere", "celestial"],
    dish: ["dish", "antenna", "receiver", "radar", "radio"],
    charts: ["chart", "map", "scroll", "table", "atlas"],
    lens: ["lens", "mirror", "prism", "optic"],
  },
};
