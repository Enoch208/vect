import type { GameAction, GameEvent } from "../contract/game.schema.js";
import { canonicalJson } from "../domain/canonical.js";
import type { ObservedEntity, Observation } from "./observe.js";

export type RememberedRoom = {
  roomId: string;
  label: string;
  exits: string[];
  entities: ObservedEntity[];
};

export type Refusal = { key: string; snapshot: string };

export type AgentMemory = {
  rooms: RememberedRoom[];
  opened: string[];
  used: string[];
  refusals: Refusal[];
  lastEvent: GameEvent | null;
};

export function emptyMemory(): AgentMemory {
  return { rooms: [], opened: [], used: [], refusals: [], lastEvent: null };
}

export const moveKey = (from: string, to: string) => `move:${from}>${to}`;
export const interactKey = (entityId: string) => `use:${entityId}`;
export const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function snapshotOf(observation: Observation, memory: AgentMemory): string {
  return canonicalJson([observation.inventory, observation.flags, memory.used]);
}

export function remember(memory: AgentMemory, observation: Observation): AgentMemory {
  const room: RememberedRoom = {
    roomId: observation.roomId,
    label: observation.roomLabel,
    exits: observation.exits.map((exit) => exit.roomId),
    entities: observation.entities,
  };
  const known = memory.rooms.some((item) => item.roomId === room.roomId);
  return {
    ...memory,
    rooms: known
      ? memory.rooms.map((item) => (item.roomId === room.roomId ? room : item))
      : [...memory.rooms, room],
  };
}

function withRefusal(memory: AgentMemory, key: string, snapshot: string): Refusal[] {
  return [...memory.refusals.filter((item) => item.key !== key), { key, snapshot }];
}

function withoutRefusal(memory: AgentMemory, key: string): Refusal[] {
  return memory.refusals.filter((item) => item.key !== key);
}

export function learn(
  memory: AgentMemory,
  observation: Observation,
  action: GameAction,
  transition: { ok: boolean; event: GameEvent },
): AgentMemory {
  const next = { ...memory, lastEvent: transition.event };
  const snapshot = snapshotOf(observation, memory);
  if (action.type === "MOVE_TO") {
    const key = moveKey(observation.roomId, action.roomId);
    if (!transition.ok) return { ...next, refusals: withRefusal(memory, key, snapshot) };
    const edge = edgeKey(observation.roomId, action.roomId);
    return {
      ...next,
      opened: memory.opened.includes(edge) ? memory.opened : [...memory.opened, edge],
      refusals: withoutRefusal(memory, key),
    };
  }
  if (action.type === "INTERACT") {
    const key = interactKey(action.entityId);
    if (!transition.ok) return { ...next, refusals: withRefusal(memory, key, snapshot) };
    return {
      ...next,
      used: [...memory.used, action.entityId].sort(),
      refusals: withoutRefusal(memory, key),
    };
  }
  return next;
}
