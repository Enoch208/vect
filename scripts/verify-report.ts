import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  verificationReportSchema,
  type VerificationReport,
} from "../src/contract/report.schema.js";
import { engineVersion, verifierVersion } from "../src/contract/versions.js";
import { worldSpecSchema, type WorldSpec } from "../src/contract/world.schema.js";
import { canonicalJson, worldRevisionHash } from "../src/domain/canonical.js";
import { verifyReportIntegrity } from "../src/verification/report.js";
import { replayTrace } from "../src/verification/replay.js";
import { verifyWorld } from "../src/verification/verify.js";

type Check = { name: string; passed: boolean; detail: string };

const usage = "usage: pnpm verify-report <bundle.json> | <world.json> <report.json>\n";
const bundleSchema = z.object({ world: z.unknown(), report: z.unknown() });

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function loadInputs(args: string[]): { world: WorldSpec; report: VerificationReport } {
  const [first, second] = args;
  if (first === undefined) {
    process.stderr.write(usage);
    process.exit(2);
  }
  const raw =
    second === undefined
      ? bundleSchema.parse(readJson(first))
      : {
          world: readJson(first),
          report: readJson(second),
        };
  return {
    world: worldSpecSchema.parse(raw.world),
    report: verificationReportSchema.parse(raw.report),
  };
}

function check(name: string, passed: boolean, detail: string): Check {
  return { name, passed, detail };
}

function runChecks(world: WorldSpec, report: VerificationReport): Check[] {
  const revision = worldRevisionHash(world);
  const replay = replayTrace(world, report.initialSeed, report.trace);
  const fresh = verifyWorld(world, {
    seed: report.initialSeed,
    now: () => performance.now(),
    isoNow: () => new Date().toISOString(),
  });
  const sameTrace = canonicalJson(fresh.trace) === canonicalJson(report.trace);
  return [
    check("digest", verifyReportIntegrity(report), "SHA-256 of the canonical report body"),
    check(
      "revision",
      revision === report.worldRevisionHash,
      `world hashes to ${revision.slice(0, 12)}, report names ${report.worldRevisionHash.slice(0, 12)}`,
    ),
    check(
      "replay",
      replay.pass && (report.status !== "VERIFIED" || replay.finalState.won),
      replay.pass
        ? `${String(report.trace.length)} steps replay through stepGame`
        : `diverges at step ${String(replay.mismatchAt)}`,
    ),
    check(
      "fresh run",
      fresh.status === report.status,
      `a new run from seed ${String(report.initialSeed)} gives ${fresh.status}`,
    ),
    check("same trace", sameTrace, "the new run takes exactly the recorded actions"),
    check(
      "versions",
      report.engineVersion === engineVersion && report.verifierVersion === verifierVersion,
      `report ${report.engineVersion}/${report.verifierVersion}, here ${engineVersion}/${verifierVersion}`,
    ),
  ];
}

const { world, report } = loadInputs(process.argv.slice(2));
const checks = runChecks(world, report);
for (const item of checks) {
  process.stdout.write(
    `${item.passed ? "PASS" : "FAIL"}  ${item.name.padEnd(10)} ${item.detail}\n`,
  );
}
const reproduced = checks.every((item) => item.passed);
process.stdout.write(
  reproduced
    ? `\nREPRODUCED: ${report.status} for ${world.id} revision ${report.worldRevisionHash.slice(0, 12)}, seed ${String(report.initialSeed)}\n`
    : `\nREJECTED: this report does not reproduce on this world\n`,
);
process.exit(reproduced ? 0 : 1);
