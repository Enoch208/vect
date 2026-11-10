import type { ReactElement } from "react";
import type { CorridorLayout } from "./layout-types.js";
import { boxPath, clip, coord, flip, gapWidth, shift, span } from "./map-geometry.js";
import { Chip, LockMark, TagPill, TickMark, chipHeight, chipWidth, hairline } from "./map-marks.js";
import {
  frameGate,
  hasGate,
  viewGate,
  type GateFrame,
  type GateView,
  type MapModel,
} from "./map-model.js";
import { gateLabel, pillWidth } from "./map-notes.js";
import { token } from "./palette.js";

type GateProps = { frame: GateFrame; view: GateView };
type CalloutProps = { model: MapModel; corridor: CorridorLayout; frame: GateFrame };

const slabWidth = 0.3;
const leafWidth = 0.18;
const barWidth = 0.14;
const barOffsets = [-0.4, 0, 0.4];
const stubLength = 0.35;
const markAhead = 0.95;
const markAside = gapWidth / 2 + 0.6;
const tagAhead = 1.05;
const tagReach = 1.85;
const tagStep = 1.2;
const calloutRise = 1.05;
const calloutClear = gapWidth / 2 + 0.35;
const leaderInset = 0.55;
const calloutLimit = 22;

function Door({ frame, view }: GateProps): ReactElement {
  const hinge = shift(frame.at, frame.across, -gapWidth / 2);
  const jamb = shift(frame.at, frame.across, gapWidth / 2);
  const tip = shift(hinge, frame.out, gapWidth);
  const fill = token(view.tone);
  if (view.state === "closed") {
    return (
      <>
        <path d={boxPath([span(hinge, jamb, slabWidth)])} fill={fill} />
        <LockMark at={shift(frame.at, frame.out, markAhead)} tone={view.tone} />
      </>
    );
  }
  const swing = `M${coord(tip[0])} ${coord(tip[1])}A${coord(gapWidth)} ${coord(gapWidth)} 0 0 1 ${coord(jamb[0])} ${coord(jamb[1])}`;
  return (
    <>
      <path d={boxPath([span(hinge, tip, leafWidth)])} fill={fill} />
      <path d={swing} {...hairline} stroke={fill} />
      {view.state === "passed" ? (
        <TickMark at={shift(shift(frame.at, frame.out, 0.75), frame.across, 0.1)} />
      ) : null}
    </>
  );
}

function Bars({ frame, view }: GateProps): ReactElement {
  const boxes = barOffsets.flatMap((offset) => {
    const centre = shift(frame.at, frame.out, offset);
    const low = shift(centre, frame.across, -gapWidth / 2);
    const high = shift(centre, frame.across, gapWidth / 2);
    if (view.state === "closed") return [span(low, high, barWidth)];
    return [
      span(low, shift(low, frame.across, stubLength), barWidth),
      span(shift(high, frame.across, -stubLength), high, barWidth),
    ];
  });
  return (
    <>
      <path d={boxPath(boxes)} fill={token(view.tone)} />
      {view.state === "closed" ? (
        <LockMark at={shift(frame.at, flip(frame.aside), markAside)} tone={view.tone} />
      ) : null}
      {view.state === "passed" ? <TickMark at={frame.at} /> : null}
    </>
  );
}

function DoorCallout({ model, corridor, frame }: CalloutProps): ReactElement {
  const text = clip(gateLabel(model.world, corridor), calloutLimit);
  const away = flip(frame.aside);
  if (frame.out[0] === 0) {
    const beside = shift(frame.at, frame.out, calloutRise);
    return <Chip at={shift(beside, away, calloutClear + chipWidth(text) / 2)} text={text} />;
  }
  const tops = model.layout.rooms
    .filter((room) => room.id === corridor.fromRoomId || room.id === corridor.toRoomId)
    .map((room) => room.center[1] - room.size / 2);
  const start = shift(shift(frame.at, frame.out, leaderInset), away, gapWidth / 2);
  const rise = Math.min(...tops) - calloutRise;
  const leader = `M${coord(start[0])} ${coord(start[1])}V${coord(rise + chipHeight / 2)}`;
  return (
    <>
      <path d={leader} {...hairline} stroke={token("accent")} />
      <Chip at={[start[0], rise]} text={text} />
    </>
  );
}

function Gate({ model, corridor }: { model: MapModel; corridor: CorridorLayout }): ReactElement {
  const view = viewGate(model, corridor);
  const frame = frameGate(corridor);
  const hinged = corridor.gateEntityId !== null;
  const base = hinged ? shift(frame.at, frame.out, tagAhead) : frame.at;
  return (
    <g
      data-connection-id={corridor.connectionId}
      data-entity-id={corridor.gateEntityId ?? undefined}
      data-gate={view.state}
      data-highlight={view.lit ? "true" : undefined}
    >
      <title>{gateLabel(model.world, corridor)}</title>
      {hinged ? <Door frame={frame} view={view} /> : <Bars frame={frame} view={view} />}
      {view.tags.map((tag, index) => {
        const centre = shift(base, frame.aside, tagReach + index * tagStep);
        return (
          <TagPill
            key={tag}
            x={centre[0] - pillWidth(tag) / 2}
            z={centre[1]}
            tag={tag}
            tone={view.tone}
          />
        );
      })}
      {hinged && view.lit ? <DoorCallout model={model} corridor={corridor} frame={frame} /> : null}
    </g>
  );
}

export function Gates({ model }: { model: MapModel }): ReactElement {
  return (
    <g data-layer="gates">
      {model.layout.corridors.map((corridor) =>
        corridor.kind === "corridor" && hasGate(corridor) ? (
          <Gate key={corridor.connectionId} model={model} corridor={corridor} />
        ) : null,
      )}
    </g>
  );
}
