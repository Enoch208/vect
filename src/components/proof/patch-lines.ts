import type { Expr } from "../../contract/expr.schema.js";
import type { PatchOperation, WorldPatch } from "../../contract/patch.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";

function roomName(world: WorldSpec, roomId: string): string {
  return world.rooms.find((item) => item.id === roomId)?.label ?? roomId;
}

function entityName(world: WorldSpec, entityId: string): string {
  return world.entities.find((item) => item.id === entityId)?.label ?? entityId;
}

function between(world: WorldSpec, connectionId: string): string {
  const found = world.connections.find((item) => item.id === connectionId);
  if (found === undefined) return connectionId;
  return `${roomName(world, found.fromRoomId)} and ${roomName(world, found.toRoomId)}`;
}

function condition(expr: Expr, world: WorldSpec): string {
  switch (expr.op) {
    case "true":
      return "nothing";
    case "hasItem":
      return world.entities.find((item) => item.grantsItemId === expr.itemId)?.label ?? expr.itemId;
    case "flag": {
      const setter = world.entities.find((item) => item.setsFlag === expr.flagId);
      return `${setter?.label ?? expr.flagId} switched ${expr.value ? "on" : "off"}`;
    }
    case "all":
    case "any":
      return expr.of
        .map((child) => {
          const text = condition(child, world);
          const nested = (child.op === "all" || child.op === "any") && child.op !== expr.op;
          return nested ? `(${text})` : text;
        })
        .join(expr.op === "all" ? " and " : " or ");
  }
}

function line(world: WorldSpec, operation: PatchOperation): string {
  switch (operation.op) {
    case "addRoom":
      return `Add room ${operation.room.label}`;
    case "addEntity":
      return `Add ${operation.entity.label} in ${roomName(world, operation.entity.roomId)}`;
    case "moveEntity": {
      const moving = world.entities.find((item) => item.id === operation.entityId);
      const from = moving === undefined ? "its room" : roomName(world, moving.roomId);
      return `Move ${entityName(world, operation.entityId)} from ${from} to ${roomName(world, operation.toRoomId)}`;
    }
    case "removeEntity":
      return `Remove ${entityName(world, operation.entityId)}`;
    case "addConnection":
      return `Connect ${roomName(world, operation.connection.fromRoomId)} and ${roomName(world, operation.connection.toRoomId)}`;
    case "removeConnection":
      return `Disconnect ${between(world, operation.connectionId)}`;
    case "setConnectionPredicate":
      return operation.predicate.op === "true"
        ? `Remove the condition between ${between(world, operation.connectionId)}`
        : `Require ${condition(operation.predicate, world)} between ${between(world, operation.connectionId)}`;
    case "setEntityRequirement":
      return operation.requires.op === "true"
        ? `Let ${entityName(world, operation.entityId)} be used with no condition`
        : `Require ${condition(operation.requires, world)} to use ${entityName(world, operation.entityId)}`;
    case "setGoalPredicate":
      return `Set the goal to need ${condition(operation.predicate, world)}`;
    case "setTheme":
      return `Change the theme to ${operation.theme}`;
  }
}

export function patchLines(patch: WorldPatch, before: WorldSpec): string[] {
  return patch.operations.map((operation) => line(before, operation));
}
