import type { WorldEntity, WorldSpec } from "../../contract/world.schema.js";
import { keyOpens } from "./truth.js";

export type Pairing = {
  entityTags: Map<string, string>;
  connectionTags: Map<string, string[]>;
};

function prefixOf(entity: WorldEntity): string {
  if (entity.blocksConnectionId !== null) return "B";
  return entity.grantsItemId !== null ? "K" : "S";
}

export function pairTags(world: WorldSpec): Pairing {
  const counts = new Map<string, number>();
  const entityTags = new Map<string, string>();
  const connectionTags = new Map<string, string[]>();
  for (const entity of world.entities) {
    const opens = keyOpens(world, entity);
    if (opens.length === 0) continue;
    const prefix = prefixOf(entity);
    const next = (counts.get(prefix) ?? 0) + 1;
    counts.set(prefix, next);
    const tag = `${prefix}${String(next)}`;
    entityTags.set(entity.id, tag);
    for (const id of opens) connectionTags.set(id, [...(connectionTags.get(id) ?? []), tag]);
  }
  return { entityTags, connectionTags };
}
