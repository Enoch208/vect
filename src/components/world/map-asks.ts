import { isInteractive } from "../../domain/world-lookup.js";
import { padRadius } from "./layout-rooms.js";
import {
  sideVector,
  type CorridorLayout,
  type Point,
  type RoomLayout,
  type SceneLayout,
} from "./layout-types.js";
import { corners, innerBox, type Zones } from "./map-boxes.js";
import {
  flip,
  glyphAdvance,
  roomTextSize,
  samePoint,
  shift,
  span,
  squareAt,
  textWidth,
  wrap,
} from "./map-geometry.js";
import {
  gateLabel,
  isLit,
  padKey,
  titleStep,
  type Ask,
  type NoteContext,
  type RoomTitle,
} from "./map-notes.js";

type PadEnd = { corridor: CorridorLayout; end: "from" | "to"; at: Point };

const titleDrops = [0, 1.25, 2.5];
const mouthDepth = 1.5;
const mouthWidth = 1.4;
const laneWidth = 0.5;

function padsIn(room: RoomLayout, layout: SceneLayout): PadEnd[] {
  return layout.corridors.flatMap((corridor) => {
    const ends: PadEnd[] = [];
    if (corridor.kind !== "portal") return ends;
    if (corridor.fromRoomId === room.id) ends.push({ corridor, end: "from", at: corridor.from });
    if (corridor.toRoomId === room.id) ends.push({ corridor, end: "to", at: corridor.to });
    return ends;
  });
}

export function zonesOf(room: RoomLayout, context: NoteContext): Zones {
  const things = context.layout.entities
    .filter((item) => item.roomId === room.id && !context.gateIds.has(item.id))
    .map((item) => squareAt([item.position[0], item.position[2]], item.footprint));
  const pads = padsIn(room, context.layout).map((pad) => squareAt(pad.at, padRadius));
  const mouths = room.openings.map((opening) => {
    const threshold = shift(opening.point, flip(sideVector[opening.side]), mouthDepth);
    return span(opening.point, threshold, mouthWidth);
  });
  const lanes = room.openings.map((opening) => {
    const upright = opening.side === "n" || opening.side === "s";
    const axis: Point = upright
      ? [opening.point[0], room.center[1]]
      : [room.center[0], opening.point[1]];
    return span(opening.point, axis, laneWidth);
  });
  return { hard: [...things, ...pads, ...mouths], soft: lanes };
}

export function titleOptions(room: RoomLayout): RoomTitle[] {
  const limit = Math.floor(innerBox(room).w / (roomTextSize * glyphAdvance));
  const label = room.label.toUpperCase();
  const split = wrap(label, limit);
  const whole = label.length <= limit ? [[label]] : [];
  const layouts = split.length > 1 ? [...whole, split] : [split];
  const sized = layouts.map((lines) => ({
    lines,
    w: Math.max(...lines.map((line) => textWidth(line, roomTextSize))),
    h: roomTextSize + (lines.length - 1) * titleStep,
  }));
  return titleDrops.flatMap((drop) => {
    const perLayout = sized.map(({ lines, w, h }) =>
      corners(room, w, h, drop).map((box): RoomTitle => ({ box, lines })),
    );
    return [0, 1, 2, 3].flatMap((corner) => perLayout.flatMap((options) => options[corner] ?? []));
  });
}

export function entityAsks(room: RoomLayout, context: NoteContext, named: boolean): Ask[] {
  const spots = new Map(context.layout.entities.map((item) => [item.id, item]));
  return context.world.entities.flatMap((entity): Ask[] => {
    const spot = spots.get(entity.id);
    const tag = context.tags.entity.get(entity.id);
    if (spot === undefined || entity.roomId !== room.id || context.gateIds.has(entity.id)) {
      return [];
    }
    const isNamed = isInteractive(entity) || entity.kind === "goal" || tag !== undefined;
    if (isNamed !== named || (!isNamed && !context.highlights.has(entity.id))) return [];
    const at = { x: spot.position[0], z: spot.position[2], r: spot.footprint };
    const tags = tag === undefined ? [] : [tag];
    return [
      { key: entity.id, into: context.notes.entities, at, slot: false, tags, text: entity.label },
    ];
  });
}

export function padAsks(room: RoomLayout, context: NoteContext): Ask[] {
  return padsIn(room, context.layout).flatMap(({ corridor, end, at }): Ask[] => {
    const titled = corridor.gateEntityId === null ? end === "from" : samePoint(corridor.gate, at);
    const slot = corridor.gated || corridor.gateEntityId !== null;
    const tags = context.tags.connection.get(corridor.connectionId) ?? [];
    const text =
      titled && isLit(context.highlights, corridor) ? gateLabel(context.world, corridor) : null;
    if (!slot && tags.length === 0 && text === null) return [];
    const key = padKey(corridor.connectionId, end);
    const spot = { x: at[0], z: at[1], r: padRadius };
    return [{ key, into: context.notes.pads, at: spot, slot, tags, text }];
  });
}
