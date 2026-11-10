import type { GameAction } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { entityById, roomById } from "../../domain/world-lookup.js";
import type { TestRun } from "../../store/test-store.js";
import type { WorldVersion } from "../../store/types.js";
import { reportStatusFor } from "../../verification/report.js";
import type { BadgeStatus } from "../studio/status.js";

export function describeAction(world: WorldSpec, action: GameAction): string {
  switch (action.type) {
    case "MOVE_TO":
      return `Move to ${roomById(world, action.roomId)?.label ?? action.roomId}`;
    case "INTERACT":
      return `Use ${entityById(world, action.entityId)?.label ?? action.entityId}`;
    case "INSPECT":
      return `Inspect ${entityById(world, action.entityId)?.label ?? action.entityId}`;
    case "WAIT":
      return `Wait ${String(action.ticks)} ticks`;
  }
}

export function shortHash(hash: string): string {
  return hash.slice(0, 12);
}

export function stepNumber(index: number): string {
  return String(index + 1).padStart(3, "0");
}

export function runStatus(version: WorldVersion, run: TestRun | null): BadgeStatus {
  if (run === null) return "UNVERIFIED";
  if (run.report !== null) return reportStatusFor(version.world, run.report);
  if (run.revisionHash !== version.revisionHash) return "UNVERIFIED";
  return run.status === "running" ? "RUNNING" : "CANCELLED";
}
