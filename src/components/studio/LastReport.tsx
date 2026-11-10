import type { WorldVersion } from "../../store/types.js";
import { useProjectStore } from "../../store/project-store.js";
import { useTestStore } from "../../store/test-store.js";
import { reportStatusFor } from "../../verification/report.js";
import { StatusBadge } from "./StatusBadge.js";

export function LastReport({ version }: { version: WorldVersion }) {
  const reports = useProjectStore((project) => project.reports);
  const run = useTestStore((test) => test.run);
  const report =
    reports[version.revisionHash] ?? (version.parentHash ? reports[version.parentHash] : undefined);
  const status = report ? reportStatusFor(version.world, report) : null;
  return (
    <aside className="space-y-4 overflow-y-auto border-l border-rule p-4">
      <h2 className="studio-label">Test evidence</h2>
      {report && status ? (
        <>
          <StatusBadge status={status} />
          <p className="text-body-s">
            {report.failureReason ??
              (status === "VERIFIED"
                ? "Verified within the game's rules."
                : "See the report status and findings.")}
          </p>
          {report.findings.map((finding, index) => (
            <p key={`${finding.code}-${String(index)}`} className="text-body-s">
              {finding.explanation}
            </p>
          ))}
        </>
      ) : (
        <p className="text-body-s text-muted">No completed report for this revision.</p>
      )}
      {run?.status === "running" && (
        <button
          type="button"
          className="studio-button"
          onClick={() => {
            useTestStore.getState().cancel();
          }}
        >
          Cancel test
        </button>
      )}
    </aside>
  );
}
