import type { Theme } from "../../contract/codes.js";
import { palette } from "./palette.js";
import { propVariants } from "./props/index.js";

export type MaterialSpec = { color: string; roughness: number; metalness: number };

export type LightRigSpec = {
  keyColor: string;
  keyIntensity: number;
  keyDirection: [number, number, number];
  fillColor: string;
  fillIntensity: number;
  skyColor: string;
  groundColor: string;
  hemisphereIntensity: number;
  environmentIntensity: number;
  shadowOpacity: number;
};

export type ThemeKit = {
  plinth: MaterialSpec;
  floor: MaterialSpec;
  wall: MaterialSpec;
  trim: MaterialSpec;
  fixture: MaterialSpec;
  accent: string;
  gateClosed: string;
  gateOpen: string;
  ink: string;
  edge: string;
  hairline: string;
  paper: string;
  fog: { color: string; near: number; far: number };
  lights: LightRigSpec;
  propVariants: readonly string[];
};

const matte = (color: string, roughness = 0.92): MaterialSpec => ({
  color,
  roughness,
  metalness: 0,
});

const sharedLights: LightRigSpec = {
  keyColor: "#FFFDF8",
  keyIntensity: 1.05,
  keyDirection: [-0.62, 1, 0.5],
  fillColor: "#EEF1F6",
  fillIntensity: 0.2,
  skyColor: "#FFFFFF",
  groundColor: "#E8E7E2",
  hemisphereIntensity: 1.2,
  environmentIntensity: 0.3,
  shadowOpacity: 0.2,
};

const shared = {
  accent: palette.accent,
  gateClosed: palette.accent,
  gateOpen: palette.positive,
  ink: palette.ink,
  edge: "#6E6E6B",
  paper: palette.paper,
  fog: { color: palette.paper, near: 150, far: 420 },
} as const;

const kits: Record<Theme, Omit<ThemeKit, "propVariants">> = {
  observatory: {
    ...shared,
    plinth: matte("#F3F3F0"),
    floor: matte("#E3E7EB", 0.86),
    wall: matte("#F5F5F3"),
    trim: matte("#D5DBE1", 0.8),
    fixture: matte("#C9D1D9", 0.7),
    hairline: "#CBD1D7",
    lights: { ...sharedLights, fillColor: "#E6EEF8" },
  },
  temple: {
    ...shared,
    plinth: matte("#F4F1EA"),
    floor: matte("#EBE2D0", 0.9),
    wall: matte("#F6F3EC"),
    trim: matte("#DDD0B6", 0.85),
    fixture: matte("#D3C4A4", 0.8),
    hairline: "#D9CDB4",
    lights: { ...sharedLights, keyColor: "#FFF6E6", fillColor: "#F5EEDF" },
  },
  castle: {
    ...shared,
    plinth: matte("#EFEEEB"),
    floor: matte("#DCDBD6", 0.95),
    wall: matte("#F0EFEC"),
    trim: matte("#C9C7C0", 0.9),
    fixture: matte("#BDBBB4", 0.85),
    hairline: "#C6C5BF",
    lights: { ...sharedLights, keyIntensity: 1, fillColor: "#ECECEC" },
  },
};

export function themeKit(theme: Theme): ThemeKit {
  return { ...kits[theme], propVariants: propVariants(theme) };
}
