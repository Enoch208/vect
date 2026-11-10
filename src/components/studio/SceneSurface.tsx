import { Component, lazy, Suspense, useEffect, useRef, type ReactNode } from "react";
import type { WorldSceneProps } from "../world/types.js";
import { StatusBadge } from "./StatusBadge.js";

const WorldScene = lazy(() =>
  import("../world/index.js").then((module) => ({ default: module.WorldScene })),
);

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        className="flex h-full flex-col items-center justify-center gap-5 p-[26px] text-center"
      >
        <StatusBadge status="ERROR" />
        <h2 className="font-display text-[26.7px] font-semibold uppercase">
          The 3D view is unavailable
        </h2>
        <p className="max-w-sm text-body">
          Use the room and object controls in the inspector to play. Reload to try the 3D view
          again.
        </p>
        <button
          type="button"
          className="studio-button"
          onClick={() => {
            window.location.reload();
          }}
        >
          Reload 3D view
        </button>
      </div>
    );
  }
}

export function SceneSurface(props: WorldSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    function checkReady() {
      if (node?.querySelector('[data-world-scene="ready"]')) {
        node.dataset["sceneReady"] = "true";
        observer.disconnect();
      }
    }
    const observer = new MutationObserver(checkReady);
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["data-world-scene"],
      subtree: true,
    });
    checkReady();
    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={container} className="h-full min-h-[360px] w-full">
      <SceneBoundary>
        <Suspense
          fallback={
            <div role="status" className="flex h-full items-center justify-center gap-3">
              <StatusBadge status="RUNNING" />
              <span className="studio-label">Building the scene</span>
            </div>
          }
        >
          <WorldScene {...props} />
        </Suspense>
      </SceneBoundary>
    </div>
  );
}
