import type { ReactElement } from "react";
import { actorAnchor, pathAnchors } from "./anchors.js";
import type { CorridorLayout } from "./layout-types.js";
import { boxPath, coord, gapWidth, round, span, squareAt } from "./map-geometry.js";
import { hairline } from "./map-marks.js";
import { gateEntityIds, hasGate, isDrawn, type MapModel } from "./map-model.js";
import { isLit } from "./map-notes.js";
import { token } from "./palette.js";
import type { WorldMapProps } from "./types.js";

type LayerProps = { model: MapModel };

const roomGlow = 0.9;
const entityGlow = 0.7;
const gateGlow = 1.9;
const padGlow = 1.6;
const bandGlow = 1.3;
const tickReach = 0.22;
const actorDot = 0.45;
const actorRing = 0.8;

function CorridorHalo({ model, corridor }: LayerProps & { corridor: CorridorLayout }) {
  const fill = token("accentSoft");
  if (corridor.kind === "portal") {
    return (
      <>
        <circle cx={round(corridor.from[0])} cy={round(corridor.from[1])} r={padGlow} fill={fill} />
        <circle cx={round(corridor.to[0])} cy={round(corridor.to[1])} r={padGlow} fill={fill} />
      </>
    );
  }
  const banded = !hasGate(corridor) || model.highlights.has(corridor.connectionId);
  const band = boxPath([span(corridor.from, corridor.to, gapWidth + bandGlow)]);
  return (
    <>
      {banded ? <path d={band} fill={fill} /> : null}
      {hasGate(corridor) ? (
        <circle
          cx={round(corridor.gate[0])}
          cy={round(corridor.gate[1])}
          r={gateGlow}
          fill={fill}
        />
      ) : null}
    </>
  );
}

export function Halos({ model }: LayerProps): ReactElement {
  const fill = token("accentSoft");
  const gateIds = gateEntityIds(model.layout);
  const spots = new Map(model.layout.entities.map((item) => [item.id, item]));
  return (
    <g data-layer="halos">
      {model.layout.rooms.map((room) =>
        model.highlights.has(room.id) ? (
          <path
            key={room.id}
            d={boxPath([squareAt(room.center, room.size / 2 + roomGlow)])}
            fill={fill}
          />
        ) : null,
      )}
      {model.layout.corridors.map((corridor) =>
        isLit(model.highlights, corridor) ? (
          <CorridorHalo key={corridor.connectionId} model={model} corridor={corridor} />
        ) : null,
      )}
      {model.world.entities.map((entity) => {
        const spot = spots.get(entity.id);
        const shown = model.highlights.has(entity.id) && isDrawn(model, entity, gateIds);
        if (spot === undefined || !shown) return null;
        return (
          <circle
            key={entity.id}
            cx={round(spot.position[0])}
            cy={round(spot.position[2])}
            r={round(spot.footprint + entityGlow)}
            fill={fill}
          />
        );
      })}
    </g>
  );
}

export function Trail({ model, path }: LayerProps & Pick<WorldMapProps, "path">) {
  const points = pathAnchors(model.world, model.layout, path);
  if (points.length < 2) return null;
  const ticks = points
    .map(
      ([x, z]) =>
        `M${coord(x - tickReach)} ${coord(z)}h${coord(tickReach * 2)}M${coord(x)} ${coord(z - tickReach)}v${coord(tickReach * 2)}`,
    )
    .join("");
  return (
    <g data-layer="path">
      <polyline
        points={points.map(([x, z]) => `${coord(x)},${coord(z)}`).join(" ")}
        {...hairline}
        stroke={token("ink")}
        strokeDasharray="5 4"
      />
      <path d={ticks} {...hairline} stroke={token("ink")} />
    </g>
  );
}

export function Actor({ model }: LayerProps): ReactElement {
  const [x, z] = actorAnchor(model.world, model.layout, model.state);
  return (
    <g data-layer="actor" data-actor-room={model.state.currentRoomId}>
      <circle
        cx={round(x)}
        cy={round(z)}
        r={actorRing}
        {...hairline}
        fill={token("paper")}
        stroke={token("ink")}
      />
      <circle cx={round(x)} cy={round(z)} r={actorDot} fill={token("ink")} />
    </g>
  );
}
