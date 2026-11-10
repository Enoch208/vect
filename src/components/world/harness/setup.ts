import { themes, type Theme } from "../../../contract/codes.js";
import type { GameAction, GameState } from "../../../contract/game.schema.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { createInitialState, stepGame } from "../../../domain/step-game.js";
import { solve } from "../../../verification/solve.js";
import type { Presentation } from "../presentation.js";
import { propGallery } from "./gallery.js";
import { harnessWorlds } from "./scenarios.js";

export type Setup = {
  world: WorldSpec;
  start: GameState;
  path: Array<{ x: number; z: number }>;
  actor: "player" | "agent";
  highlightIds: string[];
  reducedMotion: boolean;
  interactive: boolean;
  labelProps: boolean;
  zoom: number;
  autoplay: GameAction[];
  repeat: boolean;
  map: boolean;
  showStats: boolean;
  presentation: Presentation;
};

function isTheme(value: string | null): value is Theme {
  return themes.some((theme) => theme === value);
}

export function readSetup(search: string): Setup {
  const params = new URLSearchParams(search);
  const chosen =
    harnessWorlds[params.get("world") ?? "observatory"] ?? harnessWorlds["observatory"];
  if (chosen === undefined) throw new Error("The observatory fixture is missing");
  const theme = params.get("theme");
  const gallery = params.get("view") === "props" && isTheme(theme) ? propGallery(theme) : null;
  const themed = isTheme(theme) ? { ...chosen.world, theme } : chosen.world;
  const world = gallery ?? themed;
  const script: GameAction[] = gallery === null ? (solve(chosen.script).path ?? []) : [];
  const steps = Number(params.get("step") ?? 0);
  let state = createInitialState(world, world.seed);
  const path = [state.position];
  for (const action of script.slice(0, steps)) {
    state = stepGame(world, state, action).state;
    path.push(state.position);
  }
  return {
    world,
    start: state,
    path,
    actor: params.get("actor") === "agent" ? "agent" : "player",
    highlightIds: (params.get("highlight") ?? "").split(",").filter((id) => id !== ""),
    reducedMotion: params.get("reduced") === "1",
    interactive: params.get("static") !== "1",
    labelProps: gallery !== null,
    zoom: Number(params.get("zoom") ?? 1),
    autoplay: params.get("autoplay") === "1" ? script.slice(steps) : [],
    repeat: params.get("repeat") === "1",
    map: params.get("view") === "map",
    showStats: params.has("fps"),
    presentation: {
      view:
        params.get("view") === "elevation"
          ? "elevation"
          : params.get("view") === "overview" || gallery !== null
            ? "overview"
            : "follow",
      labels: params.get("clean") !== "1",
    },
  };
}
