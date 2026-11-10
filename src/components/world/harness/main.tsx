import "@fontsource-variable/geist-mono";
import { StrictMode, useEffect, useMemo, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import type { GameAction } from "../../../contract/game.schema.js";
import { stepGame } from "../../../domain/step-game.js";
import { WorldScene } from "../index.js";
import { palette } from "../palette.js";
import { PresentationContext } from "../presentation.js";
import { readSetup, type Setup } from "./setup.js";
import { WorldMap } from "../map.js";
import { Stats } from "./Stats.js";

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
  const next = setup.autoplay[state.gameTick - setup.start.gameTick];
  useEffect(() => {
    if (next === undefined && (!setup.repeat || !state.won)) return;
    const timer = window.setTimeout(() => {
      if (next === undefined) {
        setState(setup.start);
        setPath(setup.path);
        setStatus("RESET");
      } else act(next);
    }, 1300);
    return () => {
      window.clearTimeout(timer);
    };
  });
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
      {setup.map ? (
        <div data-world-scene="ready" style={{ width: "100%", height: "100%" }}>
          <WorldMap world={setup.world} state={state} path={path} highlightIds={highlightIds} />
        </div>
      ) : (
        <PresentationContext value={setup.presentation}>
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
        </PresentationContext>
      )}
      {setup.showStats && <Stats />}
      {setup.presentation.labels && (
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
      )}
    </div>
  );
}

const root = document.getElementById("root");
if (root === null) throw new Error("The #root element is missing from the scene harness");
document.body.style.margin = "0";
document.body.style.minHeight = "100vh";
document.body.style.setProperty("--font-mono", '"Geist Mono Variable", ui-monospace, monospace');
const icon = document.createElement("link");
icon.rel = "icon";
icon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
document.head.append(icon);

createRoot(root).render(
  <StrictMode>
    <Harness setup={readSetup(window.location.search)} />
  </StrictMode>,
);
