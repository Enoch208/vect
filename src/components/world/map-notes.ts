import type { WorldSpec } from "../../contract/world.schema.js";
import type { CorridorLayout, Disc, SceneLayout } from "./layout-types.js";
import { tagTextSize, textWidth, type Box } from "./map-geometry.js";
import type { MapTags } from "./map-tags.js";

export const pillHeight = 0.95;
export const slotWidth = 0.8;
export const noteGap = 0.25;
export const titleStep = 1.05;
export const lineStep = 0.75;

export type Note = { box: Box; slot: boolean; tags: string[]; lines: string[] };
export type RoomTitle = { box: Box; lines: string[] };
export type MapNotes = {
  titles: Map<string, RoomTitle>;
  entities: Map<string, Note>;
  pads: Map<string, Note>;
};

export type Ask = {
  key: string;
  into: Map<string, Note>;
  at: Disc;
  slot: boolean;
  tags: string[];
  text: string | null;
};

export type NoteContext = {
  world: WorldSpec;
  layout: SceneLayout;
  tags: MapTags;
  highlights: ReadonlySet<string>;
  gateIds: ReadonlySet<string>;
  notes: MapNotes;
};

export function pillWidth(tag: string): number {
  return Math.max(pillHeight, textWidth(tag, tagTextSize) + 0.4);
}

export function padKey(connectionId: string, end: "from" | "to"): string {
  return `${connectionId}/${end}`;
}

export function isLit(highlights: ReadonlySet<string>, corridor: CorridorLayout): boolean {
  const byGate = corridor.gateEntityId !== null && highlights.has(corridor.gateEntityId);
  return byGate || highlights.has(corridor.connectionId);
}

export function gateLabel(world: WorldSpec, corridor: CorridorLayout): string {
  const door = world.entities.find((entity) => entity.id === corridor.gateEntityId);
  return (door?.label ?? corridor.connectionId).toUpperCase();
}
