import { alwaysTrue, type Expr } from "../contract/expr.schema.js";
import type { Connection, WorldEntity } from "../contract/world.schema.js";

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

export const hasItem = (itemId: string): Expr => ({ op: "hasItem", itemId });
export const flag = (flagId: string, value = true): Expr => ({ op: "flag", flagId, value });
