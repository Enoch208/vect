import type { Expr } from "../../contract/expr.schema.js";
import type { WorldEntity, WorldSpec } from "../../contract/world.schema.js";

export function itemLabel(itemId: string, world: WorldSpec): string {
  return world.entities.find((entity) => entity.grantsItemId === itemId)?.label ?? itemId;
}

export function describeExpr(expr: Expr, world: WorldSpec): string {
  switch (expr.op) {
    case "true":
      return "no prerequisites";
    case "hasItem":
      return `${itemLabel(expr.itemId, world)} in your inventory`;
    case "flag": {
      const label =
        world.entities.find((entity) => entity.setsFlag === expr.flagId)?.label ?? expr.flagId;
      return `${label} turned ${expr.value ? "on" : "off"}`;
    }
    case "all":
    case "any":
      return expr.of
        .map((child) => {
          const text = describeExpr(child, world);
          return (child.op === "any" || child.op === "all") && child.op !== expr.op
            ? `(${text})`
            : text;
        })
        .join(expr.op === "all" ? " and " : " or ");
  }
}

export function describeGoal(world: WorldSpec): string {
  const room =
    world.rooms.find((item) => item.id === world.goal.roomId)?.label ?? world.goal.roomId;
  return `Reach ${room}${world.goal.requires.op === "true" ? "" : ` with ${describeExpr(world.goal.requires, world)}`}`;
}

export function describeEntity(entity: WorldEntity, world: WorldSpec): string[] {
  const room = world.rooms.find((item) => item.id === entity.roomId)?.label ?? entity.roomId;
  const lines = [`In ${room}`];
  if (entity.requires.op !== "true") lines.push(`Requires ${describeExpr(entity.requires, world)}`);
  if (entity.grantsItemId) lines.push(`Gives ${itemLabel(entity.grantsItemId, world)}`);
  if (entity.consumesItemId) lines.push(`Uses ${itemLabel(entity.consumesItemId, world)}`);
  if (entity.setsFlag) lines.push(`Turns on ${entity.label}`);
  if (entity.blocksConnectionId) {
    const connection = world.connections.find((item) => item.id === entity.blocksConnectionId);
    const from = world.rooms.find((item) => item.id === connection?.fromRoomId)?.label;
    const to = world.rooms.find((item) => item.id === connection?.toRoomId)?.label;
    lines.push(`Blocks ${from && to ? `${from} to ${to}` : entity.blocksConnectionId}`);
  }
  return lines;
}
