import { useState, type ReactNode } from "react";
import type { WorldSceneProps } from "../world/types.js";
import { PresentationContext } from "../world/presentation.js";
import { describeGoal } from "./describe.js";
import { SceneSurface } from "./SceneSurface.js";

export function ScenePanel({
  scene,
  editing,
  children,
}: {
  scene: WorldSceneProps;
  editing: boolean;
  children: ReactNode;
}) {
  const [overview, setOverview] = useState(true);
  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden" aria-label="Playable world">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-3 py-2">
        <p className="text-body-s text-muted">
          {editing
            ? "Current world. Apply the preview to see your changes."
            : scene.actor === "agent"
              ? "The agent follows the same rules as you."
              : `Goal: ${describeGoal(scene.world)}`}
        </p>
        <div className="flex gap-2" aria-label="Camera view">
          <button
            type="button"
            className="studio-button"
            aria-pressed={overview}
            onClick={() => {
              setOverview(true);
            }}
          >
            Overview
          </button>
          <button
            type="button"
            className="studio-button"
            aria-pressed={!overview}
            onClick={() => {
              setOverview(false);
            }}
          >
            {scene.actor === "agent" ? "Follow agent" : "Follow player"}
          </button>
        </div>
      </div>
      <div className="relative min-h-[360px] flex-1">
        <PresentationContext value={{ view: overview ? "overview" : "follow", labels: true }}>
          <SceneSurface {...scene} />
        </PresentationContext>
        {children}
      </div>
    </section>
  );
}
