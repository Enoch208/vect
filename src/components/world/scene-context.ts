import { createContext, useContext } from "react";
import type { Scene } from "three";
import type { SceneLayout } from "./layout-types.js";
import type { Pairing } from "./pairing.js";
import type { ThemeKit } from "./themes.js";

export type SceneContextValue = {
  layout: SceneLayout;
  kit: ThemeKit;
  pairing: Pairing;
  reducedMotion: boolean;
  interactive: boolean;
  overlay: Scene;
};

export const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const value = useContext(SceneContext);
  if (value === null) throw new Error("useScene must be used inside WorldScene");
  return value;
}

export const labelCharacters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?'\"()[]/&+-·#%<>=_";

const allowed = new Set(labelCharacters);

export function plainLabel(text: string): string {
  return text.toUpperCase().replace(/./gu, (char) => (allowed.has(char) ? char : "?"));
}
