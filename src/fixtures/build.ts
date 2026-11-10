import { alwaysTrue, type Expr } from "../contract/expr.schema.js";
import {
  worldSpecSchema,
  type Connection,
  type Room,
  type WorldEntity,
  type WorldSpec,
} from "../contract/world.schema.js";

type EntityInput = Pick<WorldEntity, "id" | "kind" | "label" | "roomId"> & Partial<WorldEntity>;

export function entity(input: EntityInput): WorldEntity {
  return {
    localPosition: { x: 0, y: 0, z: 0 },
    requires: alwaysTrue,
    grantsItemId: null,
    setsFlag: null,
    consumesItemId: null,
    blocksConnectionId: null,
    presentation: { variant: null, glow: false },
    ...input,
  };
}

export function connection(
  id: string,
  fromRoomId: string,
  toRoomId: string,
  traversableWhen: Expr = alwaysTrue,
  doorId: string | null = null,
): Connection {
  return { id, fromRoomId, toRoomId, doorId, traversableWhen };
}

export function derive(base: WorldSpec, changes: Partial<WorldSpec>): WorldSpec {
  return worldSpecSchema.parse({ ...base, ...changes });
}

export function editEntity(world: WorldSpec, id: string, change: Partial<WorldEntity>) {
  return world.entities.map((item) => (item.id === id ? { ...item, ...change } : item));
}

export function editConnection(world: WorldSpec, id: string, change: Partial<Connection>) {
  return world.connections.map((item) => (item.id === id ? { ...item, ...change } : item));
}

export function room(id: string, label: string, x: number, z: number): Room {
  return { id, label, grid: { x, z }, prefab: "medium" };
}

type SampleInput = Pick<
  WorldSpec,
  | "id"
  | "title"
  | "theme"
  | "prompt"
  | "rooms"
  | "connections"
  | "entities"
  | "startRoomId"
  | "goal"
>;

export function sampleWorld(input: SampleInput): WorldSpec {
  return worldSpecSchema.parse({
    schemaVersion: 1,
    revision: 1,
    seed: 7,
    generationMode: "sample_fixture",
    metadata: { createdAt: "2026-11-10T00:00:00.000Z", modelId: null, adaptations: [] },
    ...input,
  });
}

export const hasItem = (itemId: string): Expr => ({ op: "hasItem", itemId });
export const flag = (flagId: string, value = true): Expr => ({ op: "flag", flagId, value });
export const allOf = (...of: Expr[]): Expr => ({ op: "all", of });
