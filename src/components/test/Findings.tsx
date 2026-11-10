import type { Finding } from "../../contract/report.schema.js";

function chipTone(finding: Finding): string {
  return finding.code === "TEST_BUDGET_EXHAUSTED" ? "bg-caution" : "bg-accent";
}

export function Findings({
  findings,
  failureReason,
}: {
  findings: readonly Finding[];
  failureReason: string | null;
}) {
  if (findings.length === 0 && failureReason === null) return null;
  return (
    <section aria-label="Findings" className="space-y-3">
      <h3 className="studio-label text-muted">Findings</h3>
      {findings.map((finding, index) => (
        <article
          key={`${finding.code}-${String(index)}`}
          className="space-y-2 border border-rule bg-paper-raised p-3"
        >
          <span
            className={`inline-block px-2 py-1 font-mono text-micro font-medium uppercase text-paper-raised ${chipTone(finding)}`}
          >
            {finding.code}
          </span>
          <p className="text-body text-ink">{finding.explanation}</p>
          {finding.entityIds.length > 0 && (
            <p className="font-mono text-micro text-muted">{finding.entityIds.join(" · ")}</p>
          )}
        </article>
      ))}
      {failureReason !== null && <p className="text-body-s text-ink-72">{failureReason}</p>}
    </section>
  );
}
