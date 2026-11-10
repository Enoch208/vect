import type { GameState } from "../../contract/game.schema.js";

export type TransitionKind = "move" | "pickup" | "unlock" | "flag" | "none";

const longestStep = 10;

function grew(previous: readonly string[], next: readonly string[]): boolean {
  return next.some((id) => !previous.includes(id));
}

function flagsChanged(previous: GameState, next: GameState): boolean {
  return Object.entries(next.activeFlags).some(
    ([flagId, value]) => previous.activeFlags[flagId] !== value,
  );
}

export function transitionKind(previous: GameState, next: GameState): TransitionKind {
  if (grew(previous.unlockedDoors, next.unlockedDoors)) return "unlock";
  if (previous.currentRoomId !== next.currentRoomId) return "move";
  if (grew(previous.inventory, next.inventory)) return "pickup";
  if (flagsChanged(previous, next) || grew(previous.collectedEntities, next.collectedEntities)) {
    return "flag";
  }
  return "none";
}

export function continues(previous: GameState, next: GameState): boolean {
  const elapsed = next.gameTick - previous.gameTick;
  return (
    previous.worldRevisionHash === next.worldRevisionHash &&
    previous.seed === next.seed &&
    elapsed >= 0 &&
    elapsed <= longestStep
  );
}
