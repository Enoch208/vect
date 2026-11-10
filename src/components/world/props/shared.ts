import type { PropSet } from "../parts.js";

export const sharedProps: PropSet = {
  variants: {
    crate: [
      { shape: "box", size: [0.86, 0.6, 0.66], at: [0, 0.3, 0] },
      { shape: "box", size: [0.9, 0.08, 0.7], at: [0, 0.64, 0], tone: "tint" },
      { shape: "box", size: [0.5, 0.4, 0.46], at: [0.08, 0.88, 0.02], turn: [0, 0.5, 0] },
    ],
    plinth: [
      { shape: "box", size: [0.8, 0.14, 0.8], at: [0, 0.07, 0], tone: "tint" },
      { shape: "box", size: [0.6, 0.9, 0.6], at: [0, 0.59, 0] },
      { shape: "box", size: [0.76, 0.1, 0.76], at: [0, 1.09, 0], tone: "tint" },
    ],
  },
  keywords: {
    crate: ["crate", "box", "chest", "supply", "cargo"],
    plinth: ["plinth", "pedestal", "stand", "base"],
  },
};
