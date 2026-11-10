import { useEffect, useState } from "react";
import type { RepairAttempt } from "../../contract/api.schema.js";
import type { RepairOutcome } from "../../contract/codes.js";
import type { VerificationReport } from "../../contract/report.schema.js";
import { startTestRun } from "../../agents/test-runner.js";
import { createApiClient } from "../../store/api-client.js";
import { useProjectStore } from "../../store/project-store.js";
import {
  runRepairFlow,
  type RepairFlowDeps,
  type RepairFlowResult,
  type RepairPhase,
} from "../../store/repair-flow.js";
import type { TestRunner } from "../../store/test-store.js";
import type { WorldVersion } from "../../store/types.js";
import { reportStatusFor } from "../../verification/report.js";
import { StatusBadge } from "../studio/StatusBadge.js";

const phases: Array<{ id: RepairPhase; label: string }> = [
  { id: "proposing", label: "Propose a bounded patch" },
  { id: "screening", label: "Screen it: applies, keeps the objective" },
  { id: "fresh-run", label: "Fresh agent run on the candidate" },
  { id: "replay", label: "Replay on the candidate revision" },
];

const outcomeWords: Record<RepairOutcome, string> = {
  ACCEPTED_FOR_VERIFICATION: "Accepted for a fresh test",
  REJECTED_INVALID: "Rejected: invalid patch",
  REJECTED_INTENT_BREAKING: "Rejected: breaks the objective",
  REJECTED_UNSOLVABLE: "Rejected: still unsolvable",
};

export type RepairPanelViewProps = {
  phase: RepairPhase | null;
  steps: number;
  result: RepairFlowResult | null;
  onCommit: (repaired: WorldVersion) => void;
  onRetry: () => void;
};

function Attempt({ attempt }: { attempt: RepairAttempt }) {
  return (
    <li className="space-y-1 border-t border-dashed border-rule-soft py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-micro text-muted">#{String(attempt.attempt)}</span>
        <StatusBadge status={attempt.mode === "live_ai" ? "AI_REPAIR" : "RULE_REPAIR"} />
        <span className="font-mono text-micro uppercase text-ink">
          {outcomeWords[attempt.outcome]}
        </span>
      </div>
      <p className="text-body-s text-ink-72">{attempt.reason}</p>
      {attempt.patch !== null && <p className="text-body-s text-ink">{attempt.patch.intent}</p>}
    </li>
  );
}

function Outcome({
  result,
  onCommit,
  onRetry,
}: Omit<RepairPanelViewProps, "phase" | "steps"> & { result: RepairFlowResult }) {
  const { candidate, candidateReport } = result;
  if (result.outcome === "VERIFIED_REPAIR" && candidate !== null && candidateReport !== null) {
    return (
      <div className="space-y-3 border border-rule bg-paper-raised p-3">
        <StatusBadge status={reportStatusFor(candidate.world, candidateReport)} />
        <p className="text-body text-ink">{candidate.instruction}</p>
        <button
          type="button"
          className="studio-button studio-button-primary"
          onClick={() => {
            onCommit(candidate);
          }}
        >
          Commit repaired version
        </button>
      </div>
    );
  }
  const title =
    result.outcome === "FAILED_REQUEST"
      ? "The repair request failed"
      : "Could not verify this repair";
  return (
    <div role="alert" className="space-y-3 border border-accent bg-accent-soft p-3">
      <p className="studio-label text-accent">{title}</p>
      {result.reason !== null && <p className="text-body text-ink">{result.reason}</p>}
      {candidateReport !== null && (
        <p className="flex items-center gap-2 text-body-s text-ink-72">
          Candidate run:{" "}
          <StatusBadge
            status={candidateReport.status === "VERIFIED" ? "ERROR" : candidateReport.status}
          />
        </p>
      )}
      <p className="text-body-s text-ink-72">
        The original draft is unchanged. You can also edit it by hand.
      </p>
      <button type="button" className="studio-button" onClick={onRetry}>
        Try the repair again
      </button>
    </div>
  );
}

export function RepairPanelView({ phase, steps, result, onCommit, onRetry }: RepairPanelViewProps) {
  const reached = phase === null ? -1 : phases.findIndex((item) => item.id === phase);
  return (
    <section aria-label="Repair" className="flex flex-col gap-4">
      <h2 className="studio-label">Repair</h2>
      <ol className="font-mono text-micro uppercase tabular-nums">
        {phases.map((item, index) => (
          <li key={item.id} className={index <= reached ? "text-ink" : "text-faint"}>
            {String(index + 1).padStart(3, "0")} {item.label}
            {item.id === "fresh-run" && index <= reached ? ` · ${String(steps)} steps` : ""}
          </li>
        ))}
      </ol>
      {result !== null && result.attempts.length > 0 && (
        <ul aria-label="Repair attempts">
          {result.attempts.map((attempt) => (
            <Attempt key={attempt.attempt} attempt={attempt} />
          ))}
        </ul>
      )}
      {result !== null && <Outcome result={result} onCommit={onCommit} onRetry={onRetry} />}
    </section>
  );
}

const defaultApi = createApiClient(fetch);

export function RepairPanel({
  version,
  report,
  onCommitted,
  api = defaultApi,
  runner = startTestRun,
}: {
  version: WorldVersion;
  report: VerificationReport;
  onCommitted: (repaired: WorldVersion) => void;
  api?: RepairFlowDeps["api"];
  runner?: TestRunner;
}) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<RepairPhase | null>(null);
  const [steps, setSteps] = useState(0);
  const [result, setResult] = useState<RepairFlowResult | null>(null);
  useEffect(() => {
    let live = true;
    void runRepairFlow({
      api,
      startTestRun: runner,
      version,
      report,
      isoNow: () => new Date().toISOString(),
      onPhase: (next) => {
        if (live) setPhase(next);
      },
      onStep: () => {
        if (live) setSteps((count) => count + 1);
      },
    }).then((next) => {
      if (live) setResult(next);
    });
    return () => {
      live = false;
    };
  }, [api, runner, version, report, round]);
  return (
    <RepairPanelView
      phase={phase}
      steps={steps}
      result={result}
      onCommit={(repaired) => {
        if (result?.outcome === "VERIFIED_REPAIR" && result.candidateReport !== null) {
          useProjectStore.getState().recordReport(result.candidateReport);
        }
        onCommitted(repaired);
      }}
      onRetry={() => {
        setPhase(null);
        setSteps(0);
        setResult(null);
        setRound((count) => count + 1);
      }}
    />
  );
}
