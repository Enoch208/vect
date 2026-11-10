import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { verificationReportSchema } from "../../src/contract/report.schema.js";
import { worldSpecSchema, type WorldSpec } from "../../src/contract/world.schema.js";
import { ProofViewLayout } from "../../src/components/proof/ProofView.js";
import { reportBundle } from "../../src/components/proof/bundle.js";
import { proposeRuleRepair } from "../../src/agents/rule-repair.js";
import { applyPatch } from "../../src/domain/apply-patch.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import type { WorldVersion } from "../../src/store/types.js";
import { verifyReportIntegrity } from "../../src/verification/report.js";
import { verifyWorld } from "../../src/verification/verify.js";

const clock = { now: () => 0, isoNow: () => "2026-11-11T00:00:00.000Z" };
const noop = () => undefined;

function versionOf(world: WorldSpec, extra: Partial<WorldVersion> = {}): WorldVersion {
  return {
    id: world.id,
    world,
    revisionHash: worldRevisionHash(world),
    source: "edited",
    origin: "live_ai",
    modelId: null,
    parentHash: null,
    patch: null,
    instruction: "",
    createdAt: clock.isoNow(),
    ...extra,
  };
}

const broken = versionOf(observatoryKeyBehindDoor);
const beforeReport = verifyWorld(broken.world, { seed: broken.world.seed, ...clock });
const patch = (() => {
  const finding = beforeReport.findings[0];
  const proposed = finding === undefined ? null : proposeRuleRepair(broken.world, finding);
  if (proposed === null) throw new Error("no repair");
  return proposed;
})();
const applied = applyPatch(broken.world, patch);
if (!applied.ok) throw new Error(applied.reason);
const repaired = versionOf(applied.candidate, {
  id: "repaired",
  source: "repaired",
  origin: "deterministic_rule",
  parentHash: broken.revisionHash,
  patch,
  instruction: patch.intent,
});
const afterReport = verifyWorld(repaired.world, { seed: beforeReport.initialSeed, ...clock });

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");
}

function render(after = afterReport) {
  return renderToString(
    <ProofViewLayout
      before={broken}
      after={repaired}
      beforeReport={beforeReport}
      afterReport={after}
      onPlay={noop}
      onReplay={noop}
      onDownload={noop}
    />,
  );
}

describe("ProofViewLayout", () => {
  it("both columns carry their own hash and status", () => {
    const html = render();
    const text = textOf(html);
    expect(html).toContain('data-status="FAILED"');
    expect(html).toContain('data-status="VERIFIED"');
    expect(text).toContain(broken.revisionHash.slice(0, 12));
    expect(text).toContain(repaired.revisionHash.slice(0, 12));
    expect(text).toContain(beforeReport.reportId);
    expect(text).toContain(afterReport.reportId);
    expect(text).toContain("CIRCULAR_DEPENDENCY");
    expect(text).toContain("Move Access Key from Control Room to Library");
    expect(text).toContain("Rule-based repair");
    expect(text).toContain("Fixed with patch");
    expect(text).toContain("Play repaired version");
    expect(text).toContain(
      `Check it yourself: pnpm verify-report ${reportBundle(repaired.world, afterReport).fileName}`,
    );
  });

  it("never claims a fix when the repaired report does not verify", () => {
    const tampered = { ...afterReport, initialSeed: 3 };
    const html = render(tampered);
    expect(html).not.toContain('data-status="VERIFIED"');
    expect(textOf(html)).not.toContain("Fixed with patch");
  });
});

describe("reportBundle", () => {
  it("Download report contains the world and a report whose digest verifies", () => {
    const bundle = reportBundle(repaired.world, afterReport);
    expect(bundle.fileName).toBe(
      `vect-report-${repaired.world.id}-${repaired.revisionHash.slice(0, 12)}.json`,
    );
    const parsed = JSON.parse(bundle.json) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual(["report", "world"]);
    const world = worldSpecSchema.parse(parsed["world"]);
    const report = verificationReportSchema.parse(parsed["report"]);
    expect(verifyReportIntegrity(report)).toBe(true);
    expect(worldRevisionHash(world)).toBe(report.worldRevisionHash);
  });
});
