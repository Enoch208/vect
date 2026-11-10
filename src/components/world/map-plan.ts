import type { WorldSpec } from "../../contract/world.schema.js";
import type { Point, RoomLayout, SceneLayout } from "./layout-types.js";
import { entityAsks, padAsks, titleOptions, zonesOf } from "./map-asks.js";
import { innerBox, leastBlocked, nearby, settle, type Zones } from "./map-boxes.js";
import {
  clip,
  glyphAdvance,
  squareAt,
  tagTextSize,
  textWidth,
  wrap,
  type Box,
} from "./map-geometry.js";
import {
  lineStep,
  noteGap,
  pillHeight,
  pillWidth,
  slotWidth,
  type Ask,
  type MapNotes,
  type Note,
  type NoteContext,
} from "./map-notes.js";
import type { MapTags } from "./map-tags.js";

const plainHeight = 0.8;
const labelLimit = 22;
const shortLimits = [12, 7];
const noteReach = 2.4;
const arrivalClear = 0.7;
const actorClear = 0.9;

function clearsActor(box: Box, actor: Point | null): boolean {
  if (actor === null) return true;
  const dx = Math.max(box.x - actor[0], 0, actor[0] - box.x - box.w);
  const dz = Math.max(box.z - actor[1], 0, actor[1] - box.z - box.h);
  return Math.hypot(dx, dz) >= actorClear;
}

function wordings(room: RoomLayout, ask: Ask, lead: number): string[][] {
  if (ask.text === null) return [[]];
  const label = ask.text.toUpperCase();
  const most = (innerBox(room).w - lead) / (tagTextSize * glyphAdvance);
  const whole = Math.min(labelLimit, most);
  const broken = wrap(label, whole);
  const drafts = [
    [clip(label, whole)],
    ...(broken.length > 1 ? [broken] : []),
    ...shortLimits.map((limit) => [clip(label, Math.min(limit, most))]),
    ...(lead > 0 ? [[]] : []),
  ];
  const keys = drafts.map((lines) => lines.join("\n"));
  return drafts.filter((_, index) => keys.indexOf(keys[index] ?? "") === index);
}

function place(room: RoomLayout, ask: Ask, zones: Zones, actor: Point | null): Note | null {
  const marks = ask.slot ? slotWidth + noteGap : 0;
  const lead = ask.tags.reduce((sum, tag) => sum + pillWidth(tag) + noteGap, marks);
  const base = ask.tags.length > 0 ? pillHeight : plainHeight;
  const drafts = wordings(room, ask, lead).map((lines) => {
    const widest = Math.max(0, ...lines.map((line) => textWidth(line, tagTextSize)));
    const w = lines.length === 0 ? lead - noteGap : lead + widest;
    const h = Math.max(base, plainHeight + (lines.length - 1) * lineStep);
    const reach = noteReach + (actor === null ? 0 : actorClear);
    return nearby(room, ask.at, w, h, reach).map((box): Note => ({
      box,
      slot: ask.slot,
      tags: ask.tags,
      lines,
    }));
  });
  const safe = drafts.map((options) => options.filter((note) => clearsActor(note.box, actor)));
  for (const options of safe) {
    const clear = settle(options, zones);
    if (clear !== null) return clear;
  }
  const fallback = [...safe].reverse().find((options) => options.length > 0) ?? drafts.at(-1) ?? [];
  return leastBlocked(fallback, zones);
}

export function planNotes(
  world: WorldSpec,
  layout: SceneLayout,
  tags: MapTags,
  highlights: ReadonlySet<string>,
  actor?: { roomId: string; at: Point },
): MapNotes {
  const notes: MapNotes = { titles: new Map(), entities: new Map(), pads: new Map() };
  const gateIds = new Set(layout.corridors.flatMap((corridor) => corridor.gateEntityId ?? []));
  const context: NoteContext = { world, layout, tags, highlights, gateIds, notes };
  for (const room of layout.rooms) {
    const zones = zonesOf(room, context);
    const position = actor?.roomId === room.id ? actor.at : null;
    if (position !== null) zones.hard.push(squareAt(position, actorClear));
    const candidates = titleOptions(room);
    const safe = candidates.filter((title) => clearsActor(title.box, position));
    const titles = safe.length > 0 ? safe : candidates;
    const title = settle(titles, zones) ?? leastBlocked(titles, zones);
    if (title !== null) {
      notes.titles.set(room.id, title);
      zones.hard.push(title.box);
    }
    zones.soft.push(squareAt(room.center, arrivalClear));
    const asks = [
      ...entityAsks(room, context, true),
      ...padAsks(room, context),
      ...entityAsks(room, context, false),
    ];
    for (const ask of asks) {
      const note = place(room, ask, zones, position);
      if (note === null) continue;
      zones.hard.push(note.box);
      ask.into.set(ask.key, note);
    }
  }
  return notes;
}
