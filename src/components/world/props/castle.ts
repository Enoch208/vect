import type { PropSet } from "../parts.js";
import { castleFurnishings } from "./castle-furnishings.js";

const flat = Math.PI / 2;
const diamond = Math.PI / 4;
const lean = 0.2;

export const castleProps: PropSet = {
  variants: {
    banner: [
      { shape: "box", size: [0.44, 0.08, 0.44], at: [0, 0.04, 0], tone: "tint" },
      { shape: "cylinder", size: [0.09, 0.17, 0.18], at: [0, 0.17, 0], tone: "tint", sides: 8 },
      { shape: "box", size: [0.06, 2, 0.06], at: [0, 1.24, 0] },
      { shape: "cone", size: [0.07, 0.16, 0], at: [0, 2.3, 0], tone: "fixture", sides: 4 },
      { shape: "box", size: [0.64, 0.05, 0.05], at: [0, 2.08, 0.055], tone: "fixture" },
      { shape: "box", size: [0.52, 0.78, 0.03], at: [0, 1.67, 0.055] },
      {
        shape: "cylinder",
        size: [0.3, 0.3, 0.03],
        at: [0, 1.13, 0.055],
        turn: [flat, 0, 0],
        sides: 3,
      },
      {
        shape: "box",
        size: [0.15, 0.15, 0.05],
        at: [0, 1.66, 0.055],
        turn: [0, 0, diamond],
        tone: "ink",
      },
    ],
    barrel: [
      { shape: "cylinder", size: [0.37, 0.3, 0.3], at: [0, 0.15, 0] },
      { shape: "cylinder", size: [0.37, 0.37, 0.36], at: [0, 0.48, 0] },
      { shape: "cylinder", size: [0.3, 0.37, 0.3], at: [0, 0.81, 0] },
      { shape: "cylinder", size: [0.357, 0.338, 0.08], at: [0, 0.16, 0], tone: "fixture" },
      { shape: "cylinder", size: [0.338, 0.357, 0.08], at: [0, 0.8, 0], tone: "fixture" },
      { shape: "cylinder", size: [0.25, 0.25, 0.03], at: [0, 0.97, 0], tone: "tint" },
      {
        shape: "cylinder",
        size: [0.045, 0.045, 0.08],
        at: [0, 0.48, 0.37],
        turn: [flat, 0, 0],
        tone: "ink",
      },
    ],
    rack: [
      { shape: "box", size: [0.9, 0.07, 0.5], at: [0, 0.035, 0.1], tone: "tint" },
      { shape: "box", size: [0.08, 1.36, 0.08], at: [-0.41, 0.75, 0] },
      { shape: "box", size: [0.08, 1.36, 0.08], at: [0.41, 0.75, 0] },
      { shape: "box", size: [0.74, 0.08, 0.06], at: [0, 0.5, 0] },
      { shape: "box", size: [0.74, 0.08, 0.06], at: [0, 1.25, 0] },
      { shape: "box", size: [0.06, 1.9, 0.06], at: [0, 1.006, 0.111], turn: [-lean, 0, 0] },
      {
        shape: "cone",
        size: [0.08, 0.32, 0],
        at: [0, 2.094, -0.109],
        turn: [-lean, 0, 0],
        tone: "fixture",
        sides: 4,
      },
      { shape: "box", size: [0.06, 1.85, 0.06], at: [-0.2, 0.982, 0.116], turn: [-lean, 0, 0] },
      {
        shape: "box",
        size: [0.24, 0.3, 0.04],
        at: [-0.35, 1.614, -0.012],
        turn: [-lean, 0, 0],
        tone: "fixture",
      },
      {
        shape: "box",
        size: [0.1, 1.32, 0.03],
        at: [0.2, 0.722, 0.169],
        turn: [-lean, 0, 0],
        tone: "fixture",
      },
      {
        shape: "box",
        size: [0.3, 0.06, 0.07],
        at: [0.2, 1.398, 0.032],
        turn: [-lean, 0, 0],
        tone: "fixture",
      },
      {
        shape: "box",
        size: [0.05, 0.26, 0.05],
        at: [0.2, 1.555, 0],
        turn: [-lean, 0, 0],
        tone: "tint",
      },
    ],
    torch: [
      { shape: "cylinder", size: [0.24, 0.27, 0.07], at: [0, 0.035, 0], tone: "tint", sides: 8 },
      { shape: "cylinder", size: [0.06, 0.16, 0.2], at: [0, 0.17, 0], tone: "tint", sides: 8 },
      { shape: "box", size: [0.06, 0.9, 0.06], at: [0, 0.72, 0], tone: "fixture" },
      {
        shape: "cylinder",
        size: [0.075, 0.075, 0.08],
        at: [0, 0.74, 0],
        tone: "fixture",
        sides: 8,
      },
      { shape: "cylinder", size: [0.28, 0.11, 0.3], at: [0, 1.3, 0], tone: "fixture", sides: 8 },
      { shape: "cylinder", size: [0.28, 0.28, 0.07], at: [0, 1.485, 0], tone: "fixture", sides: 8 },
      { shape: "cone", size: [0.13, 0.42, 0], at: [0, 1.73, 0], sides: 6 },
      {
        shape: "cone",
        size: [0.09, 0.26, 0],
        at: [0.13, 1.64, 0.04],
        turn: [0, 0, -0.3],
        sides: 6,
      },
      {
        shape: "cone",
        size: [0.08, 0.22, 0],
        at: [-0.1, 1.62, -0.07],
        turn: [-0.2, 0, 0.35],
        sides: 6,
      },
    ],
    ...castleFurnishings,
  },
  keywords: {
    banner: ["banner", "flag", "pennant", "tapestry", "heraldry"],
    barrel: ["barrel", "cask", "keg"],
    rack: ["rack", "weapon", "sword", "spear", "arms", "halberd"],
    torch: ["torch", "brazier", "sconce", "fire", "lantern", "cresset"],
    anvil: ["anvil", "forge", "smith"],
    throne: ["throne", "seat", "chair"],
    table: ["table", "bench", "feast", "banquet"],
    armor: ["armor", "armour", "knight", "suit", "helm", "cuirass"],
  },
};
