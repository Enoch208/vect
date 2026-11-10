import { useMemo, type ReactElement } from "react";
import { Entities } from "./map-entities.js";
import { Gates } from "./map-gates.js";
import { coord, viewBoxOf } from "./map-geometry.js";
import { buildModel, planMap } from "./map-model.js";
import { Actor, Halos, Trail } from "./map-overlay.js";
import { Portals } from "./map-portals.js";
import { Corridors, Rooms } from "./map-rooms.js";
import type { WorldMapProps } from "./types.js";

const sheet = { display: "block", userSelect: "none" } as const;

export function WorldMap({ world, state, path, highlightIds }: WorldMapProps): ReactElement {
  const highlightKey = highlightIds.join(" ");
  const plan = useMemo(() => planMap(world, highlightKey), [world, highlightKey]);
  const model = buildModel(plan, world, state);
  const view = viewBoxOf(plan.layout.bounds);
  return (
    <svg
      role="img"
      aria-label={`Blueprint map of ${world.title}`}
      data-world-id={world.id}
      viewBox={`${coord(view.x)} ${coord(view.z)} ${coord(view.w)} ${coord(view.h)}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={sheet}
    >
      <Halos model={model} />
      <Corridors model={model} />
      <Rooms model={model} />
      <Gates model={model} />
      <Portals model={model} />
      <Entities model={model} />
      <Trail model={model} path={path} />
      <Actor model={model} />
    </svg>
  );
}
