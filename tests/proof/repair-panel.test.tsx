import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import type { RepairAttempt } from "../../src/contract/api.schema.js";
import { RepairPanelView } from "../../src/components/proof/RepairPanel.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatory } from "../../src/fixtures/observatory.js";
import type { RepairFlowResult } from "../../src/store/repair-flow.js";
import { verifyWorld } from "../../src/verification/verify.js";

const clock = { now: () => 0, isoNow: () => "2026-11-10T23:30:00.000Z" };
const noop = () => undefined;

const attempts: RepairAttempt[] = [
  {
    attempt: 1,
    mode: "live_ai",
    patch: null,
    candidateRevisionHash: null,
    outcome: "REJECTED_INTENT_BREAKING",
    reason: "It removes or moves the goal the player was asked to reach.",
  },
  {
    attempt: 2,
    mode: "deterministic_rule",
    patch: null,
    candidateRevisionHash: null,
    outcome: "REJECTED_UNSOLVABLE",
    reason: "The solver still finds no way to finish.",
  },
];

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");
}

function render(result: RepairFlowResult | null, committed = false): string {
  return renderToString(
    <RepairPanelView
      phase="replay"
      steps={5}
      result={result}
      onCommit={noop}
      onRetry={noop}
      committed={committed}
    />,
  );
}

describe("RepairPanelView", () => {
  it("an unverified candidate shows Could not verify this repair and no commit", () => {
    const candidateReport = verifyWorld(observatory, { seed: 1, ...clock, maxSteps: 2 });
    const text = textOf(
      render({
        attempts,
        candidate: null,
        candidateReport,
        outcome: "UNVERIFIED_REPAIR",
        reason:
          "The fresh run on the candidate ended INCONCLUSIVE, so the repair was not committed.",
        failure: null,
      }),
    );
    expect(text).toContain("Could not verify this repair");
    expect(text).toContain("The original draft is unchanged");
    expect(text).not.toContain("Commit repaired version");
    expect(text).toContain("AI repair proposal");
    expect(text).toContain("Rule-based repair");
  });

  it("no candidate lists every attempt's reason", () => {
    const text = textOf(
      render({
        attempts,
        candidate: null,
        candidateReport: null,
        outcome: "NO_CANDIDATE",
        reason: "No repair attempt kept the objective and passed the solver.",
        failure: null,
      }),
    );
    for (const attempt of attempts) expect(text).toContain(attempt.reason);
    expect(text).not.toContain("Commit repaired version");
  });

  it("a verified candidate offers the commit with its Verified status, once", () => {
    const candidateReport = verifyWorld(observatory, { seed: 1, ...clock });
    const result: RepairFlowResult = {
      attempts,
      candidate: {
        id: "repaired-x",
        world: observatory,
        revisionHash: worldRevisionHash(observatory),
        source: "repaired",
        origin: "deterministic_rule",
        modelId: null,
        parentHash: "broken",
        patch: null,
        instruction: "Move Access Key to Library",
        createdAt: clock.isoNow(),
      },
      candidateReport,
      outcome: "VERIFIED_REPAIR",
      reason: null,
      failure: null,
    };
    const html = render(result);
    expect(html).toContain('data-status="VERIFIED"');
    expect(textOf(html)).toContain("Commit repaired version");
    const after = render(result, true);
    expect(after).toMatch(/<button[^>]*disabled=""[^>]*>Committed<\/button>/);
  });
});
