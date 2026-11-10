import type { Expr } from "../contract/expr.schema.js";
import type { WorldEntity, WorldSpec } from "../contract/world.schema.js";
import { isInteractive } from "../domain/world-lookup.js";

export type Need = { kind: "item" | "flag"; id: string };

export type Explored = {
  rooms: Set<string>;
  items: Set<string>;
  flags: Set<string>;
};

function intersect(sets: Need[][]): Need[] {
  const [first, ...rest] = sets;
  if (first === undefined) return [];
  return first.filter((need) =>
    rest.every((other) => other.some((item) => item.kind === need.kind && item.id === need.id)),
  );
}

export function necessaryNeeds(expr: Expr): Need[] {
  switch (expr.op) {
    case "hasItem":
      return [{ kind: "item", id: expr.itemId }];
    case "flag":
      return expr.value ? [{ kind: "flag", id: expr.flagId }] : [];
    case "all":
      return expr.of.flatMap(necessaryNeeds);
    case "any":
      return intersect(expr.of.map(necessaryNeeds));
    case "true":
      return [];
  }
}

function distinct(needs: Need[]): Need[] {
  const seen = new Set<string>();
  return needs.filter((need) => {
    const tag = `${need.kind}:${need.id}`;
    if (seen.has(tag)) return false;
    seen.add(tag);
    return true;
  });
}

export function neverObtained(explored: Explored, needs: Need[]): Need[] {
  return distinct(needs).filter((need) =>
    need.kind === "item" ? !explored.items.has(need.id) : !explored.flags.has(need.id),
  );
}

export function entityNeeds(entity: WorldEntity): Need[] {
  const consumed: Need[] =
    entity.consumesItemId === null ? [] : [{ kind: "item", id: entity.consumesItemId }];
  return [...necessaryNeeds(entity.requires), ...consumed];
}

export function providersOf(world: WorldSpec, need: Need): WorldEntity[] {
  return world.entities.filter(
    (entity) =>
      isInteractive(entity) &&
      (need.kind === "item" ? entity.grantsItemId === need.id : entity.setsFlag === need.id),
  );
}

export function needName(world: WorldSpec, need: Need): string {
  const provider = providersOf(world, need)[0];
  if (provider === undefined) return `"${need.id}"`;
  if (need.kind === "flag") return `${provider.label} switched on`;
  return provider.kind === "key" ? provider.label : `the item from ${provider.label}`;
}
