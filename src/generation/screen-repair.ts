import type { RepairOutcome } from "../contract/codes.js";
import { repairAllowedOperations, type WorldPatch } from "../contract/patch.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { applyPatch } from "../domain/apply-patch.js";
import { checkWorld } from "../verification/check-world.js";
import { intentViolations } from "../verification/intent.js";

type ScreenedRepair = { outcome: RepairOutcome; reason: string; candidate: WorldSpec | null };
const allowed: readonly string[] = repairAllowedOperations;

export function screenRepair(base: WorldSpec, patch: WorldPatch): ScreenedRepair {
  if (patch.operations.some((operation) => !allowed.includes(operation.op)))
    return {
      outcome: "REJECTED_INVALID",
      reason: "The patch uses an operation not allowed in repairs.",
      candidate: null,
    };
  const applied = applyPatch(base, patch);
  if (!applied.ok) return { outcome: "REJECTED_INVALID", reason: applied.reason, candidate: null };
  const violations = intentViolations(base, applied.candidate);
  if (violations.length > 0)
    return { outcome: "REJECTED_INTENT_BREAKING", reason: violations.join("; "), candidate: null };
  const checked = checkWorld(applied.candidate);
  if (checked.solvability?.status !== "SOLVABLE")
    return {
      outcome: "REJECTED_UNSOLVABLE",
      reason:
        [...checked.structural, ...(checked.solvability?.findings ?? [])]
          .map((finding) => finding.explanation)
          .join("; ") || "The solver could not establish a route to the objective.",
      candidate: null,
    };
  return {
    outcome: "ACCEPTED_FOR_VERIFICATION",
    reason: "The patch preserves the objective and passes the solver. A fresh run must verify it.",
    candidate: applied.candidate,
  };
}
