import type { TestStatus } from "../../contract/codes.js";
import type { VerificationReport } from "../../contract/report.schema.js";
import type { WorldVersion } from "../../store/types.js";
import { reportStatusFor } from "../../verification/report.js";

export type BadgeStatus =
  | TestStatus
  | "DRAFT"
  | "UNVERIFIED"
  | "EXAMPLE"
  | "AI_GENERATED"
  | "LOCAL_PARSER"
  | "RULE_REPAIR"
  | "AI_REPAIR";

export function badgeFor(version: WorldVersion): BadgeStatus {
  if (version.source === "example") return "EXAMPLE";
  if (version.source === "repaired")
    return version.origin === "deterministic_rule" ? "RULE_REPAIR" : "AI_REPAIR";
  if (version.origin === "sample_fixture" || version.world.generationMode === "sample_fixture")
    return "EXAMPLE";
  if (version.origin === "deterministic_parser") return "LOCAL_PARSER";
  return "AI_GENERATED";
}

export function versionStatus(
  version: WorldVersion,
  reports: Record<string, VerificationReport>,
): BadgeStatus {
  const report =
    reports[version.revisionHash] ?? (version.parentHash ? reports[version.parentHash] : undefined);
  if (report) return reportStatusFor(version.world, report);
  return version.source === "edited" ? "DRAFT" : "UNVERIFIED";
}
