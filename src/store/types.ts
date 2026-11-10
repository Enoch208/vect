import type { GenerationMode, RepairMode } from "../contract/codes.js";
import type { GameAction, GameEvent, GameState, GameTransition } from "../contract/game.schema.js";
import type { WorldPatch } from "../contract/patch.schema.js";
import type { VerificationReport } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";

export type WorldVersion = {
  id: string;
  world: WorldSpec;
  revisionHash: string;
  source: "example" | "generated" | "edited" | "repaired";
  origin: GenerationMode | RepairMode;
  modelId: string | null;
  parentHash: string | null;
  patch: WorldPatch | null;
  instruction: string;
  createdAt: string;
};

export type ProjectStore = {
  versions: WorldVersion[];
  activeId: string | null;
  reports: Record<string, VerificationReport>;
  addVersion: (version: WorldVersion) => void;
  select: (id: string) => void;
  undo: () => void;
  redo: () => void;
  recordReport: (report: VerificationReport) => void;
  active: () => WorldVersion | null;
};

export type PlayStore = {
  state: GameState | null;
  log: GameEvent[];
  lastRefused: GameEvent | null;
  start: (world: WorldSpec) => void;
  act: (action: GameAction) => GameTransition | null;
  reset: () => void;
};
