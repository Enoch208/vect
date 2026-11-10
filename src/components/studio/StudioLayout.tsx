import { useEffect, useMemo, useState } from "react";
import type { Screen, ScreenEvent } from "../../app/screen.js";
import { useMotionPreference } from "../../app/use-motion-preference.js";
import { createInitialState } from "../../domain/step-game.js";
import { usePlayStore } from "../../store/play-store.js";
import { useProjectStore } from "../../store/project-store.js";
import { useTestStore } from "../../store/test-store.js";
import type { WorldVersion } from "../../store/types.js";
import { reportStatusFor } from "../../verification/report.js";
import { ControlsHelp } from "../game/ControlsHelp.js";
import { Hud } from "../game/Hud.js";
import { WonCard } from "../game/WonCard.js";
import { TestPanel } from "../test/TestPanel.js";
import { PromptHistory } from "./PromptHistory.js";
import { LastReport } from "./LastReport.js";
import { Inspector } from "./Inspector.js";
import { SceneSurface } from "./SceneSurface.js";
import { StatusBadge } from "./StatusBadge.js";
import { Toolbar } from "./Toolbar.js";

export function StudioLayout({
  version,
  screen,
  onScreen,
}: {
  version: WorldVersion;
  screen: Screen;
  onScreen: (event: ScreenEvent) => void;
}) {
  const play = usePlayStore();
  const test = useTestStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const motion = useMotionPreference();
  const initial = useMemo(() => createInitialState(version.world, version.world.seed), [version]);
  const testing =
    screen === "testing" ||
    screen === "verified" ||
    screen === "failed" ||
    screen === "inconclusive" ||
    screen === "repairing" ||
    screen === "retesting" ||
    screen === "proof_view";
  const repairing = screen === "repairing" || screen === "retesting" || screen === "proof_view";
  const boundRun = test.run?.revisionHash === version.revisionHash ? test.run : null;
  const current = boundRun ? test.current() : null;
  const state = testing
    ? (current?.state ?? initial)
    : play.state?.worldRevisionHash === version.revisionHash
      ? play.state
      : initial;

  useEffect(() => {
    useTestStore.getState().bindTo(version);
    return () => {
      useTestStore.getState().cancel();
    };
  }, [version]);

  useEffect(() => {
    if (screen === "testing" && boundRun?.report)
      onScreen({ type: "TEST_FINISHED", status: reportStatusFor(version.world, boundRun.report) });
  }, [screen, boundRun, version, onScreen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      )
        return;
      if (event.key === "?") {
        event.preventDefault();
        setHelpOpen((open) => !open);
      }
      if (event.key === "Escape" && screen === "playing") onScreen({ type: "RETURN" });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [screen, onScreen]);

  function syncSelection(change: () => void) {
    useTestStore.getState().cancel();
    change();
    const active = useProjectStore.getState().active();
    if (active) usePlayStore.getState().start(active.world);
    setSelectedId(null);
    onScreen({ type: "RETURN" });
  }

  function runTest() {
    useTestStore.getState().start(version);
    onScreen({ type: "TEST" });
  }

  const path =
    testing && boundRun
      ? [
          initial.position,
          ...boundRun.steps.slice(0, boundRun.shown).map((step) => step.state.position),
        ]
      : [];
  return (
    <main>
      <Toolbar
        version={version}
        screen={screen}
        onScreen={onScreen}
        onSelect={(id) => {
          syncSelection(() => {
            useProjectStore.getState().select(id);
          });
        }}
        onUndo={() => {
          syncSelection(() => {
            useProjectStore.getState().undo();
          });
        }}
        onRedo={() => {
          syncSelection(() => {
            useProjectStore.getState().redo();
          });
        }}
        onTest={runTest}
        onHelp={() => {
          setHelpOpen(true);
        }}
        reducedMotion={motion.reducedMotion}
        onMotion={motion.toggle}
      />
      {motion.notice && (
        <p
          role="status"
          className="flex items-center gap-3 border-b border-rule px-4 py-2 text-body-s"
        >
          <StatusBadge status="ERROR" />
          {motion.notice}
        </p>
      )}
      <div
        className={
          screen === "playing"
            ? "studio-workspace studio-workspace-play"
            : testing
              ? "studio-workspace studio-workspace-test"
              : "studio-workspace"
        }
      >
        {screen !== "playing" && !testing && <PromptHistory />}
        <section className="relative min-w-0 overflow-hidden" aria-label="Playable world">
          <SceneSurface
            key={version.revisionHash}
            world={version.world}
            state={state}
            actor={testing ? "agent" : "player"}
            path={path}
            highlightIds={testing ? test.highlightIds() : (play.lastRefused?.affectedIds ?? [])}
            selectedEntityId={selectedId}
            interactive={!testing && !helpOpen}
            reducedMotion={motion.reducedMotion}
            onMoveTo={(roomId) => {
              play.act({ type: "MOVE_TO", roomId });
            }}
            onInteract={(entityId) => {
              play.act({ type: "INTERACT", entityId });
            }}
            onSelect={setSelectedId}
          />
          {!testing && state.won && <WonCard onReset={play.reset} onTest={runTest} />}
          <p className="pointer-events-none absolute top-3 left-3 border border-rule bg-paper px-2 py-1 font-mono text-micro uppercase">
            {testing ? "Agent run" : "WASD / arrows · E interact · ? controls"}
          </p>
        </section>
        {screen !== "playing" &&
          (repairing ? (
            <LastReport version={version} />
          ) : testing ? (
            <aside className="overflow-y-auto border-l border-rule p-4">
              <TestPanel
                version={version}
                onRepair={() => {
                  onScreen({ type: "REPAIR" });
                }}
              />
            </aside>
          ) : (
            <Inspector
              world={version.world}
              state={state}
              selectedId={selectedId}
              interactive={!helpOpen}
              onSelect={setSelectedId}
              onMove={(roomId) => {
                play.act({ type: "MOVE_TO", roomId });
              }}
              onInteract={(entityId) => {
                play.act({ type: "INTERACT", entityId });
              }}
            />
          ))}
      </div>
      <Hud
        world={version.world}
        state={state}
        lastEvent={testing ? null : (play.log.at(-1) ?? null)}
        refused={!testing && play.lastRefused !== null}
      />
      {helpOpen && (
        <ControlsHelp
          onClose={() => {
            setHelpOpen(false);
          }}
        />
      )}
    </main>
  );
}
