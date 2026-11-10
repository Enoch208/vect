import type { Expr } from "../contract/expr.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { blockersOf, entityById, isInteractive } from "../domain/world-lookup.js";

function triviallyTrue(expr: Expr): boolean {
  switch (expr.op) {
    case "true":
      return true;
    case "all":
      return expr.of.every(triviallyTrue);
    case "any":
      return expr.of.some(triviallyTrue);
    case "hasItem":
    case "flag":
      return false;
  }
}

function gatedConnections(world: WorldSpec): number {
  return world.connections.filter(
    (item) => !triviallyTrue(item.traversableWhen) || blockersOf(world, item).length > 0,
  ).length;
}

function goalViolations(base: WorldSpec, candidate: WorldSpec): string[] {
  const marker = entityById(candidate, base.goal.id);
  return [
    ...(candidate.goal.id !== base.goal.id || candidate.goal.roomId !== base.goal.roomId
      ? ["It changes which goal the player must reach."]
      : []),
    ...(marker?.kind !== "goal" || marker.roomId !== base.goal.roomId
      ? ["It removes or moves the goal the player was asked to reach."]
      : []),
    ...(triviallyTrue(candidate.goal.requires) && !triviallyTrue(base.goal.requires)
      ? ["It makes the goal complete without the condition it had."]
      : []),
  ];
}

function secondSources(base: WorldSpec, candidate: WorldSpec): string[] {
  const providers = base.entities.filter(isInteractive);
  const items = new Set(providers.flatMap((item) => item.grantsItemId ?? []));
  const flags = new Set(providers.flatMap((item) => item.setsFlag ?? []));
  return candidate.entities
    .filter((item) => isInteractive(item) && entityById(base, item.id) === null)
    .filter(
      (item) =>
        (item.grantsItemId !== null && items.has(item.grantsItemId)) ||
        (item.setsFlag !== null && flags.has(item.setsFlag)),
    )
    .map(
      (item) =>
        `It adds ${item.label} as a second source of something the world already provides, which bypasses the existing puzzle.`,
    );
}

export function intentViolations(base: WorldSpec, candidate: WorldSpec): string[] {
  return [
    ...goalViolations(base, candidate),
    ...(candidate.startRoomId !== base.startRoomId ? ["It moves where the player starts."] : []),
    ...(gatedConnections(candidate) < gatedConnections(base)
      ? ["It removes a lock or obstacle the world was built around."]
      : []),
    ...(candidate.theme !== base.theme ? ["It changes the world's theme."] : []),
    ...secondSources(base, candidate),
  ];
}
