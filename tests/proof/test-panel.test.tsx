import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { TestPanelView } from "../../src/components/test/TestPanel.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import type { PacedStep, TestRun } from "../../src/store/test-store.js";
import type { WorldVersion } from "../../src/store/types.js";
import { verifyWorld } from "../../src/verification/verify.js";

const isoNow = () => "2026-11-10T22:30:00.000Z";
const noop = () => undefined;

function versionOf(world: WorldSpec): WorldVersion {
  return {
    id: world.id,
    world,
    revisionHash: worldRevisionHash(world),
    source: "example",
    origin: "sample_fixture",
    modelId: null,
    parentHash: null,
    patch: null,
    instruction: "",
    createdAt: isoNow(),
  };
}

function runFor(world: WorldSpec, budget: { maxStates?: number } = {}): TestRun {
  const steps: PacedStep[] = [];
  const report = verifyWorld(world, {
    seed: world.seed,
    now: () => 0,
    isoNow,
    ...budget,
    onStep: (step, summary, state) => {
      steps.push({ step, summary, state });
    },
  });
  return {
    revisionHash: worldRevisionHash(world),
    world,
    seed: world.seed,
    steps,
    shown: steps.length,
    report,
    status: "done",
  };
}

function render(version: WorldVersion, run: TestRun | null): string {
  return renderToString(
    <TestPanelView
      version={version}
      run={run}
      onRun={noop}
      onCancel={noop}
      onInspect={noop}
      onRepair={noop}
    />,
  );
}

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

describe("TestPanelView", () => {
  it("the twin's failed report shows CIRCULAR_DEPENDENCY and Auto-fix", () => {
    const html = render(versionOf(observatoryKeyBehindDoor), runFor(observatoryKeyBehindDoor));
    const text = textOf(html);
    expect(html).toContain('data-status="FAILED"');
    expect(text).toContain("CIRCULAR_DEPENDENCY");
    expect(text).toContain("behind that same door");
    expect(text).toContain("Auto-fix");
    expect(text).toContain("Inspect failure");
    expect(text).toContain("Dependency check");
    expect(text).toContain("Agent run");
    expect(text).toContain("DOOR_LOCKED");
    expect(text).toContain("refused");
  });

  it("a digest-tampered report shows Error, not Verified", () => {
    const run = runFor(observatory);
    if (run.report === null) throw new Error("no report");
    const tampered: TestRun = { ...run, report: { ...run.report, initialSeed: 99 } };
    const html = render(versionOf(observatory), tampered);
    expect(html).toContain('data-status="ERROR"');
    expect(html).not.toContain('data-status="VERIFIED"');
    expect(textOf(html)).not.toContain("Auto-fix");
  });

  it("INCONCLUSIVE is never styled positive", () => {
    const html = render(versionOf(observatory), runFor(observatory, { maxStates: 2 }));
    expect(html).toContain('data-status="INCONCLUSIVE"');
    expect(html).not.toContain("positive");
    expect(textOf(html)).not.toContain("Auto-fix");
  });

  it("a verified run shows its evidence and no repair action", () => {
    const html = render(versionOf(observatory), runFor(observatory));
    const text = textOf(html);
    expect(html).toContain('data-status="VERIFIED"');
    expect(text).toContain("GOAL_COMPLETE");
    expect(text).toContain(worldRevisionHash(observatory).slice(0, 12));
    expect(text).toContain("vect-verifier-1");
    expect(text).not.toContain("Auto-fix");
  });

  it("a report for another revision reads STALE", () => {
    const html = render(versionOf(observatoryKeyBehindDoor), runFor(observatory));
    expect(html).toContain('data-status="STALE"');
  });

  it("a running test offers Cancel and shows no verdict", () => {
    const run: TestRun = { ...runFor(observatory), report: null, status: "running", shown: 2 };
    const html = render(versionOf(observatory), run);
    expect(html).toContain('data-status="RUNNING"');
    expect(textOf(html)).toContain("Cancel");
  });
});
