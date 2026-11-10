import { useEffect, useMemo, useState } from "react";
import type { Screen, ScreenEvent } from "./screen.js";
import { useMotionPreference } from "./use-motion-preference.js";
import { createInitialState } from "../domain/step-game.js";
import { usePlayStore } from "../store/play-store.js";
import { useProjectStore } from "../store/project-store.js";
import { useTestStore } from "../store/test-store.js";
import type { WorldVersion } from "../store/types.js";
import { reportStatusFor } from "../verification/report.js";

export function useStudioSession(
  version: WorldVersion,
  screen: Screen,
  onScreen: (event: ScreenEvent) => void,
) {
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
  const editing = screen === "editing" || screen === "pending_validation";
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
    if (
      testing &&
      boundRun?.status === "running" &&
      screen !== "testing" &&
      screen !== "repairing" &&
      screen !== "retesting"
    ) {
      onScreen({ type: "TEST" });
      return;
    }
    if (screen === "testing" && boundRun?.report)
      onScreen({ type: "TEST_FINISHED", status: reportStatusFor(version.world, boundRun.report) });
  }, [screen, boundRun, version, onScreen, testing, repairing]);

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
      if (event.key === "Escape" && screen === "playing" && !helpOpen) onScreen({ type: "RETURN" });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [screen, onScreen, helpOpen]);

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
  function changeMode(event: ScreenEvent) {
    if (
      event.type === "PLAY" ||
      event.type === "EDIT" ||
      event.type === "RETURN" ||
      event.type === "SHOW_PROOF"
    )
      test.cancel();
    onScreen(event);
  }
  return {
    play,
    test,
    selectedId,
    setSelectedId,
    helpOpen,
    setHelpOpen,
    motion,
    testing,
    repairing,
    editing,
    state,
    path,
    syncSelection,
    runTest,
    changeMode,
  };
}
