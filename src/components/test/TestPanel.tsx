import type { WorldSpec } from "../../contract/world.schema.js";
import { useTestStore, type PacedStep, type TestRun } from "../../store/test-store.js";
import type { WorldVersion } from "../../store/types.js";
import { verifyReportIntegrity } from "../../verification/report.js";
import { StatusChip } from "./StatusChip.js";
import { Assertions } from "./Assertions.js";
import { EvidenceSheet } from "./EvidenceSheet.js";
import { Findings } from "./Findings.js";
import { describeAction, runStatus, stepNumber } from "./format.js";
import { Timeline } from "./Timeline.js";

type TestPanelViewProps = {
  version: WorldVersion;
  run: TestRun | null;
  onRun: () => void;
  onCancel: () => void;
  onInspect: (entityIds: string[]) => void;
  onRepair: () => void;
};

function CurrentStep({ world, paced }: { world: WorldSpec; paced: PacedStep }) {
  const { step, summary } = paced;
  return (
    <figure aria-label="Current step" className="border border-rule bg-paper-raised">
      <p className="flex h-[26px] items-center bg-ink px-3 font-mono text-micro uppercase text-paper-raised">
        Step {stepNumber(step.index)} · {step.accepted ? "accepted" : "refused"}
      </p>
      <div className="space-y-1 p-3">
        <p className="text-body text-ink">{describeAction(world, step.action)}</p>
        <p className="text-body-s text-ink-72">{summary}</p>
        <p className="font-mono text-micro text-muted">{step.eventCode}</p>
      </div>
      <div aria-hidden className="h-1 bg-ink" />
    </figure>
  );
}

export function TestPanelView({
  version,
  run,
  onRun,
  onCancel,
  onInspect,
  onRepair,
}: TestPanelViewProps) {
  const status = runStatus(version, run);
  const bound = run !== null && run.revisionHash === version.revisionHash ? run : null;
  const shown = bound === null ? [] : bound.steps.slice(0, bound.shown);
  const current = shown.at(-1) ?? null;
  const report = bound?.report ?? null;
  const trusted = report !== null && verifyReportIntegrity(report) ? report : null;
  const running = bound?.status === "running";
  const findingIds = [...new Set(trusted?.findings.flatMap((item) => item.entityIds) ?? [])];
  return (
    <section aria-label="Agent test" className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="studio-label">Agent test</h2>
        <StatusChip status={status} />
      </header>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={status === "FAILED" ? "studio-button" : "studio-button studio-button-primary"}
          disabled={running}
          onClick={onRun}
        >
          {report === null ? "Run test" : "Run again"}
        </button>
        {running && (
          <button type="button" className="studio-button" onClick={onCancel}>
            Cancel
          </button>
        )}
        {findingIds.length > 0 && (
          <button
            type="button"
            className="studio-button"
            onClick={() => {
              onInspect(findingIds);
            }}
          >
            Inspect failure
          </button>
        )}
        {status === "FAILED" && (
          <button type="button" className="studio-button studio-button-primary" onClick={onRepair}>
            Auto-fix
          </button>
        )}
      </div>
      {run !== null && bound === null && (
        <p className="text-body-s text-ink-72">
          The last test ran on another revision. Run the test again for this one.
        </p>
      )}
      {report !== null && trusted === null && (
        <p className="text-body-s text-ink-72">
          This report failed its integrity check, so its result is not shown.
        </p>
      )}
      {current !== null && <CurrentStep world={version.world} paced={current} />}
      {trusted !== null && (
        <>
          <Findings findings={trusted.findings} failureReason={trusted.failureReason} />
          <Assertions report={trusted} />
        </>
      )}
      {bound !== null && <Timeline world={version.world} steps={shown} />}
      {trusted !== null && <EvidenceSheet report={trusted} />}
    </section>
  );
}

export function TestPanel({ version, onRepair }: { version: WorldVersion; onRepair: () => void }) {
  const run = useTestStore((store) => store.run);
  const start = useTestStore((store) => store.start);
  const cancel = useTestStore((store) => store.cancel);
  const inspect = useTestStore((store) => store.inspect);
  return (
    <TestPanelView
      version={version}
      run={run}
      onRun={() => {
        start(version);
      }}
      onCancel={cancel}
      onInspect={inspect}
      onRepair={onRepair}
    />
  );
}
