import type { TestStatus } from "../contract/codes.js";
import {
  verificationReportBodySchema,
  verificationReportSchema,
  type VerificationReport,
  type VerificationReportBody,
} from "../contract/report.schema.js";
import { engineVersion, reportVersion, verifierVersion } from "../contract/versions.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { canonicalJson, sha256Hex, worldRevisionHash } from "../domain/canonical.js";
import { replayTrace } from "./replay.js";

export type ReportBodyInput = Omit<
  VerificationReportBody,
  "reportVersion" | "engineVersion" | "verifierVersion"
>;

function digestOf(body: VerificationReportBody): string {
  return sha256Hex(canonicalJson(body));
}

export function buildReport(input: ReportBodyInput): VerificationReport {
  const body = verificationReportBodySchema.parse({
    ...input,
    reportVersion,
    engineVersion,
    verifierVersion,
  });
  return { ...body, reportDigest: digestOf(body) };
}

export function verifyReportIntegrity(report: VerificationReport): boolean {
  const parsed = verificationReportSchema.safeParse(report);
  if (!parsed.success) return false;
  const { reportDigest, ...body } = parsed.data;
  return reportDigest === digestOf(body);
}

function replaysToWin(world: WorldSpec, report: VerificationReport): boolean {
  const replay = replayTrace(world, report.initialSeed, report.trace);
  const asserted = report.assertions.length > 0 && report.assertions.every((item) => item.passed);
  return replay.pass && replay.finalState.won && report.replayPass && asserted;
}

export function reportStatusFor(currentWorld: WorldSpec, report: VerificationReport): TestStatus {
  if (!verifyReportIntegrity(report)) return "ERROR";
  if (report.worldRevisionHash !== worldRevisionHash(currentWorld)) return "STALE";
  if (report.status === "VERIFIED" && !replaysToWin(currentWorld, report)) return "ERROR";
  return report.status;
}
