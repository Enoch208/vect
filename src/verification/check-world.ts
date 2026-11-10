import type { SolvabilitySummary } from "../contract/api.schema.js";
import type { Finding } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { solve } from "./solve.js";
import { validateWorld } from "./validate-world.js";

export type WorldCheck = { structural: Finding[]; solvability: SolvabilitySummary | null };

export function checkWorld(world: WorldSpec): WorldCheck {
  const structural = validateWorld(world);
  if (structural.length > 0) return { structural, solvability: null };
  const { status, findings, exploredStates } = solve(world);
  return { structural, solvability: { status, findings, exploredStates } };
}
