import type { EntityKind } from "../../contract/codes.js";
import type { GameState } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { entityById, isInteractive } from "../../domain/world-lookup.js";
import { dims } from "./blocks.js";
import { wrapLabel, type LabelSpec } from "./label-layout.js";
import type { SceneLayout } from "./layout-types.js";
import type { Pairing } from "./pairing.js";
import { gateStates, isUsed, type GateState } from "./truth.js";

export type NoteTone = "ink" | "muted" | "accent" | "positive" | "alert";
export type Note = LabelSpec & { tone: NoteTone };

export type NoteInput = {
  world: WorldSpec;
  state: GameState;
  layout: SceneLayout;
  pairing: Pairing;
  highlightIds: readonly string[];
  selectedEntityId: string | null;
  compact: boolean;
  actor: { anchor: [number, number, number]; text: string } | null;
};

const reach: Record<EntityKind, number> = {
  key: 1.55,
  switch: 1.5,
  chest: 1.05,
  barrier: 1.6,
  trap: 0.45,
  checkpoint: 1.75,
  goal: 3.25,
  prop: 1.7,
  door: 1.7,
  portal: 1.7,
};

const stateWord: Record<GateState, string> = { closed: "LOCKED", open: "OPEN", passed: "PASSED" };
const stateTone: Record<GateState, NoteTone> = {
  closed: "accent",
  open: "muted",
  passed: "positive",
};

function roomNotes({ layout, state }: NoteInput): Note[] {
  return layout.rooms.map((room, index) => ({
    id: `room:${room.id}`,
    anchor: [room.center[0] + room.size / 2, -dims.plinthHeight, room.center[1] + room.size / 2],
    lines: wrapLabel(`[${String(index + 1).padStart(2, "0")}] ${room.label}`, 26),
    badge: null,
    below: true,
    priority: 6,
    tone: room.id === state.currentRoomId ? "ink" : "muted",
  }));
}

function gateNotes(input: NoteInput): Note[] {
  const { world, state, layout, pairing, highlightIds, compact } = input;
  const states = gateStates(world, state);
  return layout.corridors.flatMap((corridor, index): Note[] => {
    const gate = states.get(corridor.connectionId) ?? "closed";
    const door = corridor.gateEntityId === null ? null : entityById(world, corridor.gateEntityId);
    const flagged =
      highlightIds.includes(corridor.connectionId) ||
      (door !== null && highlightIds.includes(door.id));
    const linked = corridor.kind === "portal";
    if (!corridor.gated && !linked) return [];
    if (gate !== "closed" && !flagged && (compact || !linked)) return [];
    const tags = pairing.connectionTags.get(corridor.connectionId) ?? [];
    const name = door?.label ?? (linked ? `Link ${String(index + 1)}` : "Gate");
    const note = (id: string, x: number, y: number, z: number): Note => ({
      id,
      anchor: [x, y, z],
      lines: [...wrapLabel(name), stateWord[gate]],
      badge: tags.length === 0 ? null : tags.join("+"),
      below: false,
      priority: flagged ? 9 : 5,
      tone: flagged ? "alert" : stateTone[gate],
    });
    const head = `gate:${corridor.connectionId}`;
    if (!linked) return [note(head, corridor.gate[0], dims.frameHeight + 0.5, corridor.gate[1])];
    return [
      note(`${head}:from`, corridor.from[0], 1.3, corridor.from[1]),
      note(`${head}:to`, corridor.to[0], 1.3, corridor.to[1]),
    ];
  });
}

function entityNotes(input: NoteInput): Note[] {
  const { world, state, layout, pairing, highlightIds, selectedEntityId, compact } = input;
  const gateIds = new Set(layout.corridors.flatMap((corridor) => corridor.gateEntityId ?? []));
  return layout.entities.flatMap((placed): Note[] => {
    const entity = entityById(world, placed.id);
    if (entity === null || gateIds.has(entity.id)) return [];
    const used = isUsed(state, entity.id);
    const flagged = highlightIds.includes(entity.id);
    const chosen = selectedEntityId === entity.id;
    const gone = entity.kind === "key" && used;
    const notable = isInteractive(entity) || entity.kind === "goal";
    if (gone || (!notable && !flagged && !chosen)) return [];
    const here = entity.roomId === state.currentRoomId;
    const named = !compact || here || flagged || chosen;
    const badge = used ? null : (pairing.entityTags.get(entity.id) ?? null);
    if (!named && badge === null) return [];
    const floor = entity.kind === "goal";
    return [
      {
        id: `entity:${entity.id}`,
        anchor: floor
          ? [placed.position[0] + 0.85, 0.06, placed.position[2] + 0.85]
          : [placed.position[0], reach[entity.kind], placed.position[2]],
        lines: named ? wrapLabel(entity.label) : [],
        badge,
        below: floor,
        priority: flagged ? 9 : here ? 4 : 2,
        tone: flagged ? "alert" : used ? "muted" : "ink",
      },
    ];
  });
}

export const actorNoteId = "actor";

function actorNotes({ actor }: NoteInput): Note[] {
  if (actor === null) return [];
  return [
    {
      id: actorNoteId,
      anchor: actor.anchor,
      lines: [` ${actor.text} `],
      badge: null,
      below: false,
      priority: 10,
      tone: "ink",
    },
  ];
}

export function sceneNotes(input: NoteInput): Note[] {
  return [...actorNotes(input), ...roomNotes(input), ...gateNotes(input), ...entityNotes(input)];
}
