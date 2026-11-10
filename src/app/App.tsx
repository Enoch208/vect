import { lazy, Suspense, useEffect, useReducer, useState } from "react";
import type { GenerateRequest } from "../contract/api.schema.js";
import { GenerationPanel } from "../components/studio/GenerationPanel.js";
import { StudioLayout } from "../components/studio/StudioLayout.js";
import { StatusBadge } from "../components/studio/StatusBadge.js";
import { observatory } from "../fixtures/observatory.js";
import { createApiClient } from "../store/api-client.js";
import { usePlayStore } from "../store/play-store.js";
import { useProjectStore } from "../store/project-store.js";
import type { WorldVersion } from "../store/types.js";
import { screenReducer } from "./screen.js";
import { useGeneration } from "./use-generation.js";
import { useProjectPersistence } from "./use-project-persistence.js";
import { makeVersion } from "./versions.js";

const Landing = lazy(() =>
  import("../components/landing/index.js").then((module) => ({ default: module.Landing })),
);
const api = createApiClient(fetch);

export function App() {
  const [inStudio, setInStudio] = useState(() => window.location.pathname.startsWith("/studio"));
  const [prompt, setPrompt] = useState("");
  const [initialExample] = useState(() => window.location.pathname === "/studio/example");
  const [screen, dispatch] = useReducer(screenReducer, "empty");
  const active = useProjectStore(
    (project) => project.versions.find((version) => version.id === project.activeId) ?? null,
  );
  const persistence = useProjectPersistence(initialExample);

  function commit(version: WorldVersion) {
    useProjectStore.getState().addVersion(version);
    usePlayStore.getState().start(version.world);
  }

  const generation = useGeneration(
    api,
    (version) => {
      commit(version);
      dispatch({ type: "GENERATION_READY" });
    },
    () => {
      dispatch({ type: "GENERATION_FAILED" });
    },
  );

  useEffect(() => {
    const onPopState = () => {
      setInStudio(window.location.pathname.startsWith("/studio"));
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  function navigate(studio: boolean) {
    window.history.pushState(null, "", studio ? "/studio" : "/");
    setInStudio(studio);
    window.scrollTo(0, 0);
  }

  function openExample() {
    generation.clear();
    commit(makeVersion(observatory, "example", "sample_fixture", null));
    dispatch({ type: "OPEN_EXAMPLE" });
    navigate(true);
  }

  function newWorld(value = "") {
    generation.clear();
    setPrompt(value);
    dispatch({ type: "NEW_WORLD" });
    navigate(true);
  }

  function generate(request: GenerateRequest) {
    dispatch({ type: "GENERATE" });
    void generation.submit(request);
  }

  function openStudio() {
    if (!active) {
      newWorld();
      return;
    }
    dispatch({ type: "RETURN" });
    navigate(true);
  }

  const entry = !active || screen === "entering_prompt" || screen === "generating";
  if (!inStudio)
    return (
      <Suspense
        fallback={
          <p role="status" className="studio-label p-[26px]">
            Opening Vect
          </p>
        }
      >
        <Landing onOpenStudio={openStudio} onOpenExample={openExample} onPrompt={newWorld} />
      </Suspense>
    );
  return (
    <div className="studio-frame">
      <header className="flex min-h-14 items-center justify-between gap-4 border-b border-rule px-[26px]">
        <a
          href="/"
          className="font-display text-xl font-semibold tracking-[-0.04em]"
          onClick={(event) => {
            event.preventDefault();
            navigate(false);
          }}
        >
          VECT
        </a>
        <span className="studio-label text-muted">
          Studio / {entry ? "New world" : "World revision"}
        </span>
        {!entry && (
          <button
            type="button"
            className="studio-label text-accent"
            onClick={() => {
              newWorld();
            }}
          >
            New world →
          </button>
        )}
      </header>
      {persistence.notice && (
        <aside
          role="status"
          className="flex flex-wrap items-center gap-3 border-b border-accent bg-accent-soft px-[26px] py-3"
        >
          <StatusBadge status="ERROR" />
          <p className="flex-1">{persistence.notice}</p>
          <button type="button" className="studio-label" onClick={persistence.dismiss}>
            Dismiss
          </button>
        </aside>
      )}
      {entry ? (
        <GenerationPanel
          prompt={prompt}
          onPrompt={setPrompt}
          onGenerate={generate}
          onOpenExample={openExample}
          onRetry={() => {
            dispatch({ type: "GENERATE" });
            generation.retry();
          }}
          phase={generation.phase}
          elapsed={generation.elapsed}
          modelId={generation.modelId}
          failure={generation.failure}
        />
      ) : (
        <StudioLayout key={active.id} version={active} screen={screen} onScreen={dispatch} />
      )}
    </div>
  );
}
