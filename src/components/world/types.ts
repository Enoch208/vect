import type { GameState } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";

export type WorldSceneProps = {
  world: WorldSpec;
  state: GameState;
  actor: "player" | "agent";
  path: ReadonlyArray<{ x: number; z: number }>;
  highlightIds: readonly string[];
  selectedEntityId: string | null;
  interactive: boolean;
  reducedMotion: boolean;
  onMoveTo: (roomId: string) => void;
  onInteract: (entityId: string) => void;
  onSelect: (entityId: string | null) => void;
};

export type WorldMapProps = Pick<WorldSceneProps, "world" | "state" | "path" | "highlightIds">;
