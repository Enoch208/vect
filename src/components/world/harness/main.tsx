import { StrictMode, useEffect, useMemo, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { themes, type Theme } from "../../../contract/codes.js";
import type { GameAction, GameState } from "../../../contract/game.schema.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { createInitialState, stepGame } from "../../../domain/step-game.js";
import { observatory, observatoryKeyBehindDoor } from "../../../fixtures/observatory.js";
import { tenRoomTemple } from "../../../fixtures/suite-large.js";
import { solve } from "../../../verification/solve.js";
import { WorldScene } from "../index.js";
import { palette } from "../palette.js";
import { propGallery } from "./gallery.js";

const worlds: Record<string, { world: WorldSpec; script: WorldSpec }> = {
  observatory: { world: observatory, script: observatory },
  twin: { world: observatoryKeyBehindDoor, script: observatory },
  temple: { world: tenRoomTemple, script: tenRoomTemple },
};

type Setup = {
  world: WorldSpec;
  start: GameState;
  path: Array<{ x: number; z: number }>;
  actor: "player" | "agent";
  highlightIds: string[];
  reducedMotion: boolean;
  interactive: boolean;
  labelProps: boolean;
  zoom: number;
};

function isTheme(value: string | null): value is Theme {
  return themes.some((theme) => theme === value);
}

function readSetup(search: string): Setup {
  const params = new URLSearchParams(search);
  const chosen = worlds[params.get("world") ?? "observatory"] ?? worlds["observatory"];
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
  };
}

function useReadyMarker(zoom: number): void {
  useEffect(() => {
    let frame = 0;
    let timer = 0;
    const poll = () => {
      if (document.querySelector('[data-world-scene="ready"]') === null) {
        frame = window.requestAnimationFrame(poll);
        return;
      }
      if (zoom !== 1) {
        document
          .querySelector("[data-world-scene] canvas")
          ?.dispatchEvent(new WheelEvent("wheel", { deltaY: -Math.log(zoom) / 0.0016 }));
      }
      timer = window.setTimeout(() => {
        document.body.dataset["sceneReady"] = "true";
      }, 900);
    };
    poll();
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [zoom]);
}

function Harness({ setup }: { setup: Setup }): ReactElement {
  const [state, setState] = useState(setup.start);
  const [path, setPath] = useState(setup.path);
  const [flash, setFlash] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState("READY");
  useReadyMarker(setup.zoom);
  const act = (action: GameAction) => {
    const result = stepGame(setup.world, state, action);
    setStatus(`${result.event.code} · ${result.event.message}`);
    setFlash(result.ok ? [] : result.event.affectedIds);
    if (!result.ok) return;
    setState(result.state);
    setPath((points) => [...points, result.state.position]);
  };
  const highlightIds = useMemo(
    () => [
      ...setup.highlightIds,
      ...flash,
      ...(setup.labelProps
        ? setup.world.entities.filter((item) => item.kind === "prop").map((item) => item.id)
        : []),
    ],
    [setup, flash],
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: palette.paper }}>
      <WorldScene
        world={setup.world}
        state={state}
        actor={setup.actor}
        path={path}
        highlightIds={highlightIds}
        selectedEntityId={selected}
        interactive={setup.interactive}
        reducedMotion={setup.reducedMotion}
        onMoveTo={(roomId) => {
          act({ type: "MOVE_TO", roomId });
        }}
        onInteract={(entityId) => {
          act({ type: "INTERACT", entityId });
        }}
        onSelect={setSelected}
      />
      <pre
        data-harness-status
        style={{
          position: "fixed",
          left: 16,
          bottom: 12,
          margin: 0,
          font: "11px ui-monospace, monospace",
          color: palette.muted,
          pointerEvents: "none",
        }}
      >
        {`${setup.world.id} · rev ${String(setup.world.revision)} · tick ${String(state.gameTick)} · ${state.won ? "WON" : status}`}
      </pre>
    </div>
  );
}

const root = document.getElementById("root");
if (root === null) throw new Error("The #root element is missing from the scene harness");
document.body.style.margin = "0";
document.body.style.minHeight = "100vh";

createRoot(root).render(
  <StrictMode>
    <Harness setup={readSetup(window.location.search)} />
  </StrictMode>,
);
