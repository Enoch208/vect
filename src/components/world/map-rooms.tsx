import type { ReactElement } from "react";
import type { CorridorLayout } from "./layout-types.js";
import {
  boxPath,
  clip,
  flip,
  gapWidth,
  midpoint,
  round,
  roomTextSize,
  shift,
  turn,
  unit,
  wallBoxes,
  wallOutline,
  wallWidth,
} from "./map-geometry.js";
import { Chip, MapText, chipHeight, chipWidth, hairline } from "./map-marks.js";
import { frameGate, hasGate, type MapModel } from "./map-model.js";
import { gateLabel, isLit, titleStep } from "./map-notes.js";
import { token } from "./palette.js";

type LayerProps = { model: MapModel };

const chipClear = gapWidth / 2 + 0.3;
const lockClear = 1;
const idLimit = 10;

function SideLabel({ model, corridor }: LayerProps & { corridor: CorridorLayout }): ReactElement {
  const text = clip(gateLabel(model.world, corridor), idLimit);
  const away = flip(frameGate(corridor).aside);
  const extent = away[0] !== 0 ? chipWidth(text) : chipHeight;
  const clear = chipClear + (hasGate(corridor) ? lockClear : 0);
  const at = shift(midpoint(corridor.from, corridor.to), away, clear + extent / 2);
  return <Chip at={at} text={text} />;
}

function Corridor({ model, corridor }: LayerProps & { corridor: CorridorLayout }): ReactElement {
  const lit = isLit(model.highlights, corridor);
  const along = unit(corridor.from, corridor.to);
  const across = turn(along);
  const start = shift(corridor.from, along, wallWidth / 2);
  const end = shift(corridor.to, along, -wallWidth / 2);
  return (
    <g data-connection-id={corridor.connectionId} data-highlight={lit ? "true" : undefined}>
      {[-1, 1].map((side) => {
        const a = shift(start, across, (side * gapWidth) / 2);
        const b = shift(end, across, (side * gapWidth) / 2);
        return (
          <line
            key={side}
            x1={round(a[0])}
            y1={round(a[1])}
            x2={round(b[0])}
            y2={round(b[1])}
            {...hairline}
            stroke={token(lit ? "accent" : "rule")}
          />
        );
      })}
      {lit && corridor.gateEntityId === null ? (
        <SideLabel model={model} corridor={corridor} />
      ) : null}
    </g>
  );
}

export function Corridors({ model }: LayerProps): ReactElement {
  return (
    <g data-layer="corridors">
      {model.layout.corridors.map((corridor, index) =>
        corridor.kind === "corridor" ? (
          <Corridor key={index} model={model} corridor={corridor} />
        ) : null,
      )}
    </g>
  );
}

export function Rooms({ model }: LayerProps): ReactElement {
  return (
    <g data-layer="rooms">
      {model.layout.rooms.map((room, index) => {
        const lit = model.highlights.has(room.id);
        const title = model.notes.titles.get(room.id);
        return (
          <g key={index} data-room-id={room.id} data-highlight={lit ? "true" : undefined}>
            <title>{room.label}</title>
            <path d={boxPath(wallBoxes(room))} fill={token("ink")} />
            {lit ? (
              <path
                d={wallOutline(room)}
                {...hairline}
                stroke={token("accent")}
                strokeWidth={2}
                strokeLinecap="square"
              />
            ) : null}
            {title?.lines.map((line, row) => (
              <MapText
                key={row}
                x={title.box.x}
                z={title.box.z + roomTextSize / 2 + row * titleStep}
                size={roomTextSize}
                tone={lit ? "accent" : "muted"}
              >
                {line}
              </MapText>
            ))}
          </g>
        );
      })}
    </g>
  );
}
