import type { ReactElement } from "react";
import { padRadius } from "./layout-rooms.js";
import type { CorridorLayout, Point } from "./layout-types.js";
import { round, tagTextSize } from "./map-geometry.js";
import { MapText, NoteRow, hairline } from "./map-marks.js";
import { viewGate, type MapModel } from "./map-model.js";
import { gateLabel, padKey } from "./map-notes.js";
import { token, type PaletteName } from "./palette.js";

type PairProps = { model: MapModel; corridor: CorridorLayout };

const innerRing = 0.62;
const ends = ["from", "to"] as const;

function Pad({ at, tag, tone }: { at: Point; tag: string; tone: PaletteName }): ReactElement {
  const stroke = token(tone);
  return (
    <g data-pad={tag}>
      <circle
        cx={round(at[0])}
        cy={round(at[1])}
        r={padRadius}
        {...hairline}
        fill={token("paper")}
        stroke={stroke}
      />
      <circle cx={round(at[0])} cy={round(at[1])} r={innerRing} {...hairline} stroke={stroke} />
      <MapText x={at[0]} z={at[1]} size={tagTextSize} tone={tone} anchor="middle">
        {tag}
      </MapText>
    </g>
  );
}

function PortalPair({ model, corridor }: PairProps): ReactElement {
  const view = viewGate(model, corridor);
  const tag = model.tags.portal.get(corridor.connectionId) ?? "P";
  const mark = view.state === "closed" ? "lock" : view.state === "passed" ? "tick" : null;
  return (
    <g
      data-connection-id={corridor.connectionId}
      data-entity-id={corridor.gateEntityId ?? undefined}
      data-gate={view.state}
      data-highlight={view.lit ? "true" : undefined}
    >
      <title>{gateLabel(model.world, corridor)}</title>
      {ends.map((end) => {
        const note = model.notes.pads.get(padKey(corridor.connectionId, end));
        return (
          <g key={end} data-pad-end={end}>
            <Pad at={corridor[end]} tag={tag} tone={view.tone} />
            {note === undefined ? null : (
              <NoteRow note={note} mark={mark} tone={view.tone} textTone="muted" lit={view.lit} />
            )}
          </g>
        );
      })}
    </g>
  );
}

export function Portals({ model }: { model: MapModel }): ReactElement {
  return (
    <g data-layer="portals">
      {model.layout.corridors.map((corridor, index) =>
        corridor.kind === "portal" ? (
          <PortalPair key={index} model={model} corridor={corridor} />
        ) : null,
      )}
    </g>
  );
}
