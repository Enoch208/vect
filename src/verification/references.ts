import type { Expr } from "../contract/expr.schema.js";
import type { Finding } from "../contract/report.schema.js";
import type { Connection, WorldEntity, WorldSpec } from "../contract/world.schema.js";
import { referencedItems } from "../domain/expr.js";
import { isInteractive } from "../domain/world-lookup.js";
import { entityLabel, sentence, wayLabel } from "./describe.js";

export type ReferenceSource =
  | { type: "connection"; connection: Connection }
  | { type: "entity"; entity: WorldEntity }
  | { type: "goal" };

export type MissingReference = { kind: "item" | "flag"; id: string; source: ReferenceSource };

export function grantedItems(world: WorldSpec): Set<string> {
  return new Set(
    world.entities.flatMap((item) =>
      isInteractive(item) && item.grantsItemId !== null ? [item.grantsItemId] : [],
    ),
  );
}

export function settableFlags(world: WorldSpec): Set<string> {
  return new Set(
    world.entities.flatMap((item) =>
      isInteractive(item) && item.setsFlag !== null ? [item.setsFlag] : [],
    ),
  );
}

function flagsNeededOn(expr: Expr): string[] {
  switch (expr.op) {
    case "flag":
      return expr.value ? [expr.flagId] : [];
    case "all":
    case "any":
      return expr.of.flatMap(flagsNeededOn);
    case "true":
    case "hasItem":
      return [];
  }
}

function sourcesOf(
  world: WorldSpec,
): Array<{ source: ReferenceSource; expr: Expr; consumes: string[] }> {
  return [
    ...world.connections.map((connection) => ({
      source: { type: "connection" as const, connection },
      expr: connection.traversableWhen,
      consumes: [],
    })),
    ...world.entities.filter(isInteractive).map((entity) => ({
      source: { type: "entity" as const, entity },
      expr: entity.requires,
      consumes: entity.consumesItemId === null ? [] : [entity.consumesItemId],
    })),
    { source: { type: "goal" as const }, expr: world.goal.requires, consumes: [] },
  ];
}

export function missingReferences(world: WorldSpec): MissingReference[] {
  const items = grantedItems(world);
  const flags = settableFlags(world);
  return sourcesOf(world).flatMap(({ source, expr, consumes }) => {
    const needItems = [...new Set([...referencedItems(expr), ...consumes])];
    const needFlags = [...new Set(flagsNeededOn(expr))];
    return [
      ...needItems
        .filter((id) => !items.has(id))
        .map((id) => ({ kind: "item" as const, id, source })),
      ...needFlags
        .filter((id) => !flags.has(id))
        .map((id) => ({ kind: "flag" as const, id, source })),
    ];
  });
}

function subject(world: WorldSpec, source: ReferenceSource): string {
  if (source.type === "connection") return wayLabel(world, source.connection);
  if (source.type === "entity") return entityLabel(world, source.entity.id);
  return "the goal";
}

export function sourceIds(world: WorldSpec, source: ReferenceSource): string[] {
  if (source.type === "connection") {
    const { connection } = source;
    return connection.doorId === null ? [connection.id] : [connection.id, connection.doorId];
  }
  if (source.type === "entity") return [source.entity.id];
  return [world.goal.id];
}

export function missingReferenceFinding(world: WorldSpec, missing: MissingReference): Finding {
  const need =
    missing.kind === "item" ? `needs item "${missing.id}"` : `needs "${missing.id}" switched on`;
  const absent = missing.kind === "item" ? "gives it" : "sets it";
  return {
    code: "MISSING_REQUIRED_ITEM",
    entityIds: sourceIds(world, missing.source),
    explanation: sentence(
      `${subject(world, missing.source)} ${need}, but nothing in this world ${absent}`,
    ),
  };
}
