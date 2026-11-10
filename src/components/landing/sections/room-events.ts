import type { EventCode } from "../../../contract/codes.js";
import type { GameState } from "../../../contract/game.schema.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { candidateActions, createInitialState, stepGame } from "../../../domain/step-game.js";
import { observatory } from "../../../fixtures/observatory.js";
import { solve } from "../../../verification/solve.js";

export type RoomEvent = {
  code: EventCode;
  message: string;
  roomId: string;
  targetIds: string[];
  state: GameState;
};

const wanted = ["DOOR_LOCKED", "ITEM_COLLECTED", "FLAG_SET", "GOAL_COMPLETE"] as const;

function refusalsFrom(world: WorldSpec, state: GameState): RoomEvent[] {
  return candidateActions(world, state).flatMap((action) => {
    const transition = stepGame(world, state, action);
    if (transition.ok) return [];
    return [
      {
        code: transition.event.code,
        message: transition.event.message,
        roomId: state.currentRoomId,
        targetIds: transition.event.affectedIds,
        state,
      },
    ];
  });
}

export function roomEvents(world: WorldSpec = observatory): RoomEvent[] {
  let state = createInitialState(world, world.seed);
  const seen: RoomEvent[] = [...refusalsFrom(world, state)];
  for (const action of solve(world).path ?? []) {
    const transition = stepGame(world, state, action);
    seen.push({
      code: transition.event.code,
      message: transition.event.message,
      roomId: transition.state.currentRoomId,
      targetIds: transition.event.affectedIds,
      state: transition.state,
    });
    state = transition.state;
    seen.push(...refusalsFrom(world, state));
  }
  return wanted.flatMap((code) => {
    const found = seen.find((event) => event.code === code);
    return found === undefined ? [] : [found];
  });
}
