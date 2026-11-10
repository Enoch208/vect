import type { GameAction, GameTransition } from "../contract/game.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { entityById, roomById } from "../domain/world-lookup.js";
import type { Choice } from "./heuristic-agent.js";

function roomName(world: WorldSpec, roomId: string): string {
  return roomById(world, roomId)?.label ?? roomId;
}

function entityName(world: WorldSpec, entityId: string | undefined): string {
  if (entityId === undefined) return "something";
  return entityById(world, entityId)?.label ?? entityId;
}

function target(action: GameAction): string {
  if (action.type === "MOVE_TO") return action.roomId;
  if (action.type === "INTERACT" || action.type === "INSPECT") return action.entityId;
  return "";
}

export function summarize(world: WorldSpec, choice: Choice, transition: GameTransition): string {
  const { event } = transition;
  const subject = target(choice.action);
  switch (event.code) {
    case "MOVED":
      if (
        choice.rule === "walk" &&
        choice.targetRoomId !== null &&
        choice.targetRoomId !== subject
      ) {
        return `Walked back to ${roomName(world, subject)}, heading for ${roomName(world, choice.targetRoomId)}`;
      }
      return `Walked to ${roomName(world, subject)}`;
    case "DOOR_UNLOCKED":
      return `Opened ${entityName(world, event.affectedIds[1])} and entered ${roomName(world, subject)}`;
    case "DOOR_LOCKED":
      return `${entityName(world, event.affectedIds[1])} is locked; looking for what opens it`;
    case "ROUTE_BLOCKED":
      return `The way to ${roomName(world, subject)} is blocked; looking for a way to clear it`;
    case "ITEM_COLLECTED":
      return `Picked up ${entityName(world, subject)}`;
    case "FLAG_SET":
      return `Switched on ${entityName(world, subject)}`;
    case "NEUTRALIZED":
      return `Cleared ${entityName(world, subject)}`;
    case "ACTIVATED":
      return `Used ${entityName(world, subject)}`;
    case "REQUIREMENT_UNMET":
      return `${entityName(world, subject)} needs something first; trying elsewhere`;
    default:
      return event.message;
  }
}
