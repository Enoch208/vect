import type { WorldPatch } from "../../contract/patch.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { describeExpr } from "./describe.js";

export function describePatch(patch: WorldPatch, before: WorldSpec): string[] {
  const room = (id: string) => before.rooms.find((item) => item.id === id)?.label ?? id;
  const entity = (id: string) => before.entities.find((item) => item.id === id);
  const connection = (id: string) => before.connections.find((item) => item.id === id);
  function endpoints(id: string) {
    const item = connection(id);
    return item ? `${room(item.fromRoomId)} and ${room(item.toRoomId)}` : id;
  }
  return patch.operations.map((operation) => {
    switch (operation.op) {
      case "addRoom":
        return `Add room ${operation.room.label}`;
      case "addEntity":
        return `Add ${operation.entity.label} in ${room(operation.entity.roomId)}`;
      case "moveEntity": {
        const item = entity(operation.entityId);
        return `Move ${item?.label ?? operation.entityId} from ${item ? room(item.roomId) : "its current room"} to ${room(operation.toRoomId)}`;
      }
      case "removeEntity":
        return `Remove ${entity(operation.entityId)?.label ?? operation.entityId}`;
      case "addConnection":
        return `Connect ${room(operation.connection.fromRoomId)} and ${room(operation.connection.toRoomId)}`;
      case "removeConnection":
        return `Disconnect ${endpoints(operation.connectionId)}`;
      case "setConnectionPredicate":
        return `Require ${describeExpr(operation.predicate, before)} between ${endpoints(operation.connectionId)}`;
      case "setEntityRequirement":
        return `Require ${describeExpr(operation.requires, before)} to use ${entity(operation.entityId)?.label ?? operation.entityId}`;
      case "setGoalPredicate":
        return `Set objective requirement to ${describeExpr(operation.predicate, before)}`;
      case "setTheme":
        return `Change theme to ${operation.theme}`;
    }
  });
}
