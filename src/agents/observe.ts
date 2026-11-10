import type { EntityKind } from "../contract/codes.js";
import type { GameEvent, GameState } from "../contract/game.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { adjacentRoomIds, entitiesIn, roomById } from "../domain/world-lookup.js";
import type { AgentMemory } from "./memory.js";

export type ObservedEntity = { id: string; kind: EntityKind; label: string; used: boolean };

export type Observation = {
  roomId: string;
  roomLabel: string;
  exits: Array<{ roomId: string; label: string }>;
  entities: ObservedEntity[];
  inventory: string[];
  flags: string[];
  lastEvent: GameEvent | null;
  memory: AgentMemory;
};

export function observeWorld(world: WorldSpec, state: GameState, memory: AgentMemory): Observation {
  const here = state.currentRoomId;
  return {
    roomId: here,
    roomLabel: roomById(world, here)?.label ?? here,
    exits: adjacentRoomIds(world, here).map((roomId) => ({
      roomId,
      label: roomById(world, roomId)?.label ?? roomId,
    })),
    entities: entitiesIn(world, here).map((item) => ({
      id: item.id,
      kind: item.kind,
      label: item.label,
      used: state.collectedEntities.includes(item.id),
    })),
    inventory: [...state.inventory],
    flags: Object.entries(state.activeFlags)
      .filter(([, on]) => on)
      .map(([flagId]) => flagId)
      .sort(),
    lastEvent: memory.lastEvent,
    memory,
  };
}
