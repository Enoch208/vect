import { interactiveKinds, type EntityKind } from "../contract/codes.js";
import type { GameAction } from "../contract/game.schema.js";
import { pickOne } from "../domain/random.js";
import {
  edgeKey,
  moveKey,
  snapshotOf,
  interactKey,
  type AgentMemory,
  type RememberedRoom,
} from "./memory.js";
import type { ObservedEntity, Observation } from "./observe.js";

export type ChoiceRule = "use-here" | "explore" | "retry" | "walk";

export type Choice = { action: GameAction; rule: ChoiceRule; targetRoomId: string | null };

const interactive: readonly EntityKind[] = interactiveKinds;

type Mind = { memory: AgentMemory; now: string };

function refusedAt(mind: Mind, key: string): string | null {
  return mind.memory.refusals.find((item) => item.key === key)?.snapshot ?? null;
}

function refusedNow(mind: Mind, key: string): boolean {
  return refusedAt(mind, key) === mind.now;
}

function visited(mind: Mind, roomId: string): boolean {
  return mind.memory.rooms.some((item) => item.roomId === roomId);
}

function usable(mind: Mind, entities: ObservedEntity[]): ObservedEntity[] {
  return entities.filter(
    (item) =>
      interactive.includes(item.kind) &&
      !item.used &&
      !mind.memory.used.includes(item.id) &&
      !refusedNow(mind, interactKey(item.id)),
  );
}

function unexplored(mind: Mind, from: string, exits: string[]): string[] {
  return exits.filter((to) => !visited(mind, to) && !refusedNow(mind, moveKey(from, to)));
}

function retryable(mind: Mind, from: string, exits: string[]): string[] {
  return exits.filter((to) => {
    const snapshot = refusedAt(mind, moveKey(from, to));
    return snapshot !== null && snapshot !== mind.now;
  });
}

function hasWork(mind: Mind, room: RememberedRoom): boolean {
  return (
    usable(mind, room.entities).length > 0 ||
    unexplored(mind, room.roomId, room.exits).length > 0 ||
    retryable(mind, room.roomId, room.exits).length > 0
  );
}

function knownNeighbours(mind: Mind, roomId: string): string[] {
  const room = mind.memory.rooms.find((item) => item.roomId === roomId);
  if (room === undefined) return [];
  return room.exits.filter(
    (to) =>
      mind.memory.opened.includes(edgeKey(roomId, to)) && !refusedNow(mind, moveKey(roomId, to)),
  );
}

function walkTowardWork(mind: Mind, here: string, random: () => number): Choice | null {
  const parents = new Map<string, string | null>([[here, null]]);
  let layer = [here];
  while (layer.length > 0) {
    const next: string[] = [];
    for (const roomId of layer) {
      for (const to of knownNeighbours(mind, roomId)) {
        if (parents.has(to)) continue;
        parents.set(to, roomId);
        next.push(to);
      }
    }
    const targets = next.filter((roomId) => {
      const room = mind.memory.rooms.find((item) => item.roomId === roomId);
      return room !== undefined && hasWork(mind, room);
    });
    const target = pickOne(random, targets);
    if (target !== null) {
      let step = target;
      while (parents.get(step) !== here) step = parents.get(step) ?? here;
      return { action: { type: "MOVE_TO", roomId: step }, rule: "walk", targetRoomId: target };
    }
    layer = next;
  }
  return null;
}

export function chooseAction(
  observation: Observation,
  memory: AgentMemory,
  random: () => number,
): Choice | null {
  const mind: Mind = { memory, now: snapshotOf(observation, memory) };
  const here = observation.roomId;
  const exits = observation.exits.map((exit) => exit.roomId);
  const entity = pickOne(random, usable(mind, observation.entities));
  if (entity !== null) {
    return {
      action: { type: "INTERACT", entityId: entity.id },
      rule: "use-here",
      targetRoomId: null,
    };
  }
  const fresh = pickOne(random, unexplored(mind, here, exits));
  if (fresh !== null) {
    return { action: { type: "MOVE_TO", roomId: fresh }, rule: "explore", targetRoomId: fresh };
  }
  const retry = pickOne(random, retryable(mind, here, exits));
  if (retry !== null) {
    return { action: { type: "MOVE_TO", roomId: retry }, rule: "retry", targetRoomId: retry };
  }
  return walkTowardWork(mind, here, random);
}
