import { useMemo } from "react";
import { layoutWorld, WorldMap } from "../world/map.js";
import type { WorldSceneProps } from "../world/types.js";
import { useWorldControls } from "../world/use-world-controls.js";

export function BlueprintSurface(props: WorldSceneProps) {
  const layout = useMemo(() => layoutWorld(props.world), [props.world]);
  useWorldControls(props, layout);
  return (
    <div data-scene-ready="true" className="flex h-full flex-col">
      <p role="status" className="border-b border-rule p-3 text-body-s">
        3D unavailable. Blueprint mode is active. Use the room controls or WASD / arrows and E to
        play.
      </p>
      <div className="min-h-0 flex-1">
        <WorldMap
          world={props.world}
          state={props.state}
          path={props.path}
          highlightIds={props.highlightIds}
        />
      </div>
    </div>
  );
}
