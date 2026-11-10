import type { GameAction, GameState } from "../../../contract/game.schema.js";
import type { Point, SceneLayout } from "../../world/layout.js";
import { pointOf, roomOf } from "./plan-geometry.js";

const bounceBack = 1.4;

function nearGate(layout: SceneLayout, fromRoomId: string, toRoomId: string): Point | null {
  const corridor = layout.corridors.find(
    (item) =>
      (item.fromRoomId === fromRoomId && item.toRoomId === toRoomId) ||
      (item.fromRoomId === toRoomId && item.toRoomId === fromRoomId),
  );
  const room = roomOf(layout, fromRoomId);
  if (corridor === undefined || room === undefined) return null;
  const [gx, gz] = corridor.gate;
  const dx = Math.sign(room.center[0] - gx);
  const dz = Math.sign(room.center[1] - gz);
  return [gx + dx * bounceBack, gz + dz * bounceBack];
}

export function agentPoint(
  layout: SceneLayout,
  before: GameState,
  action: GameAction,
  accepted: boolean,
): Point | null {
  if (action.type === "MOVE_TO") {
    if (accepted) return roomOf(layout, action.roomId)?.center ?? null;
    return nearGate(layout, before.currentRoomId, action.roomId);
  }
  if (action.type === "INTERACT" || action.type === "INSPECT") {
    const at = pointOf(layout, action.entityId);
    return at === null ? null : [at[0] - 0.9, at[1] + 0.9];
  }
  return roomOf(layout, before.currentRoomId)?.center ?? null;
}

export function startPoint(layout: SceneLayout, state: GameState): Point | null {
  return roomOf(layout, state.currentRoomId)?.center ?? null;
}
