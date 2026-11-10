import type { EventCode } from "../contract/codes.js";
import type { GameEvent, GameState, GameTransition } from "../contract/game.schema.js";
import type { WorldEntity, WorldSpec } from "../contract/world.schema.js";
import { evaluate } from "./expr.js";
import {
  connectionsBetween,
  entityById,
  gateOpen,
  isInteractive,
  isTraversable,
  roomById,
} from "./world-lookup.js";

const entityReach = 0.4;

export function isGoalComplete(world: WorldSpec, state: GameState): boolean {
  return state.currentRoomId === world.goal.roomId && evaluate(world.goal.requires, state);
}

function event(code: EventCode, message: string, affectedIds: string[]): GameEvent {
  return { code, message, affectedIds };
}

export function reject(state: GameState, code: EventCode, message: string, ids: string[]) {
  return { ok: false, state, event: event(code, message, ids) } satisfies GameTransition;
}

export function accept(world: WorldSpec, next: GameState, happened: GameEvent): GameTransition {
  if (!isGoalComplete(world, next)) return { ok: true, state: next, event: happened };
  return {
    ok: true,
    state: { ...next, won: true },
    event: event("GOAL_COMPLETE", `${happened.message}. The goal is complete`, [
      ...happened.affectedIds,
      world.goal.id,
    ]),
  };
}

function withItem(items: readonly string[], item: string): string[] {
  return [...new Set([...items, item])].sort();
}

export function move(world: WorldSpec, state: GameState, roomId: string): GameTransition {
  const target = roomById(world, roomId);
  if (target === null) return reject(state, "UNKNOWN_ROOM", `There is no room ${roomId}`, [roomId]);
  const routes = connectionsBetween(world, state.currentRoomId, roomId);
  const first = routes[0];
  if (roomId === state.currentRoomId || first === undefined) {
    return reject(state, "NOT_ADJACENT", `${target.label} is not next to this room`, [roomId]);
  }
  const open = routes.find((connection) => isTraversable(world, state, connection));
  if (open === undefined) {
    if (first.doorId !== null && !gateOpen(state, first)) {
      return reject(state, "DOOR_LOCKED", `The way to ${target.label} is locked`, [
        first.id,
        first.doorId,
      ]);
    }
    return reject(state, "ROUTE_BLOCKED", `The way to ${target.label} is blocked`, [first.id]);
  }
  const unlocking = open.doorId !== null && !state.unlockedDoors.includes(open.doorId);
  const next: GameState = {
    ...state,
    currentRoomId: roomId,
    position: { x: target.grid.x, z: target.grid.z },
    unlockedDoors:
      unlocking && open.doorId !== null
        ? withItem(state.unlockedDoors, open.doorId)
        : state.unlockedDoors,
    gameTick: state.gameTick + 1,
  };
  const ids = open.doorId === null ? [open.id, roomId] : [open.id, open.doorId, roomId];
  return accept(
    world,
    next,
    event(unlocking ? "DOOR_UNLOCKED" : "MOVED", `Entered ${target.label}`, ids),
  );
}

function effectCode(entity: WorldEntity): EventCode {
  if (entity.grantsItemId !== null) return "ITEM_COLLECTED";
  if (entity.blocksConnectionId !== null) return "NEUTRALIZED";
  if (entity.setsFlag !== null) return "FLAG_SET";
  return "ACTIVATED";
}

function applyEffects(state: GameState, entity: WorldEntity): GameState {
  const consumed =
    entity.consumesItemId === null
      ? state.inventory
      : state.inventory.filter((item) => item !== entity.consumesItemId);
  return {
    ...state,
    inventory: entity.grantsItemId === null ? consumed : withItem(consumed, entity.grantsItemId),
    activeFlags:
      entity.setsFlag === null
        ? state.activeFlags
        : { ...state.activeFlags, [entity.setsFlag]: true },
    collectedEntities: withItem(state.collectedEntities, entity.id),
    gameTick: state.gameTick + 1,
  };
}

export function interact(world: WorldSpec, state: GameState, entityId: string): GameTransition {
  const entity = entityById(world, entityId);
  if (entity === null)
    return reject(state, "UNKNOWN_ENTITY", `Nothing called ${entityId}`, [entityId]);
  const ids = [entity.id];
  if (entity.roomId !== state.currentRoomId) {
    return reject(state, "ENTITY_NOT_HERE", `${entity.label} is not in this room`, ids);
  }
  if (!isInteractive(entity)) {
    return reject(state, "NOT_INTERACTIVE", `${entity.label} cannot be used`, ids);
  }
  if (state.collectedEntities.includes(entity.id)) {
    return reject(state, "ALREADY_USED", `${entity.label} was already used`, ids);
  }
  const hasConsumable =
    entity.consumesItemId === null || state.inventory.includes(entity.consumesItemId);
  if (!hasConsumable || !evaluate(entity.requires, state)) {
    return reject(state, "REQUIREMENT_UNMET", `${entity.label} needs something first`, ids);
  }
  const room = roomById(world, entity.roomId);
  const next = {
    ...applyEffects(state, entity),
    position: {
      x: (room?.grid.x ?? 0) + entity.localPosition.x * entityReach,
      z: (room?.grid.z ?? 0) + entity.localPosition.z * entityReach,
    },
  };
  return accept(world, next, event(effectCode(entity), `Used ${entity.label}`, ids));
}

export function inspect(world: WorldSpec, state: GameState, entityId: string): GameTransition {
  const entity = entityById(world, entityId);
  if (entity === null)
    return reject(state, "UNKNOWN_ENTITY", `Nothing called ${entityId}`, [entityId]);
  if (entity.roomId !== state.currentRoomId) {
    return reject(state, "ENTITY_NOT_HERE", `${entity.label} is not in this room`, [entity.id]);
  }
  const used = state.collectedEntities.includes(entity.id) ? ", already used" : "";
  return {
    ok: true,
    state,
    event: event("INSPECTED", `${entity.label} (${entity.kind}${used})`, [entity.id]),
  };
}
