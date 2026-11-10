import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import type { WorldSceneProps } from "../world/types.js";
import type {} from "../world/postprocessing.js";
import { WorldMap, canUseWebGL } from "../world/map.js";
import { StatusBadge } from "./StatusBadge.js";
import { BlueprintSurface } from "./BlueprintSurface.js";

const WorldScene = lazy(() =>
  import("../world/index.js").then((module) => ({ default: module.WorldScene })),
);

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback;
  }
}

export function SceneSurface(props: WorldSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const [webgl] = useState(canUseWebGL);
  const [lost, setLost] = useState(false);
  useEffect(() => {
    const node = container.current;
    const onLost = () => {
      setLost(true);
    };
    node?.addEventListener("webglcontextlost", onLost, true);
    return () => {
      node?.removeEventListener("webglcontextlost", onLost, true);
    };
  }, []);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    if (!webgl) {
      node.dataset["sceneReady"] = "true";
      return;
    }
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
  }, [webgl]);
  const map = (
    <WorldMap
      world={props.world}
      state={props.state}
      path={props.path}
      highlightIds={props.highlightIds}
    />
  );
  const unavailable = <BlueprintSurface {...props} />;
  return (
    <div ref={container} className="h-full min-h-[360px] w-full">
      {webgl && !lost ? (
        <SceneBoundary fallback={unavailable}>
          <Suspense
            fallback={
              <div className="flex h-full flex-col">
                <p role="status" className="flex items-center gap-3 border-b border-rule p-3">
                  <StatusBadge status="RUNNING" />
                  <span className="studio-label">Building the scene</span>
                </p>
                <div className="min-h-0 flex-1">{map}</div>
              </div>
            }
          >
            <WorldScene {...props} />
          </Suspense>
        </SceneBoundary>
      ) : (
        unavailable
      )}
    </div>
  );
}
