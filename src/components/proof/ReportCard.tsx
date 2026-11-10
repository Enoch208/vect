import type { VerificationReport } from "../../contract/report.schema.js";
import type { WorldVersion } from "../../store/types.js";
import { reportStatusFor, verifyReportIntegrity } from "../../verification/report.js";
import { describeAction, shortHash, stepNumber } from "../test/format.js";
import { StatusBadge } from "../studio/StatusBadge.js";

const excerptLength = 6;

function Row({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex">
      <dt className="w-20 shrink-0 uppercase text-muted">{name}</dt>
      <dd className="flex min-w-0 text-ink">
        <span aria-hidden className="pr-[1ch] text-muted">
          :
        </span>
        <span className="min-w-0 break-all">{value}</span>
      </dd>
    </div>
  );
}

export function ReportCard({
  title,
  version,
  report,
  onDownload,
}: {
  title: string;
  version: WorldVersion;
  report: VerificationReport | null;
  onDownload: (report: VerificationReport) => void;
}) {
  const trusted = report !== null && verifyReportIntegrity(report) ? report : null;
  const status = report === null ? "UNVERIFIED" : reportStatusFor(version.world, report);
  const finding = trusted?.findings[0] ?? null;
  const excerpt = trusted?.trace.slice(-excerptLength) ?? [];
  return (
    <article aria-label={title} className="flex flex-col gap-3">
      <header className="flex items-center justify-between gap-3">
        <h3 className="studio-label">{title}</h3>
        <StatusBadge status={status} />
      </header>
      <dl className="space-y-1 font-mono text-micro tabular-nums">
        <Row name="Revision" value={shortHash(version.revisionHash)} />
        {trusted !== null && (
          <>
            <Row name="Seed" value={String(trusted.initialSeed)} />
            <Row name="Report" value={trusted.reportId} />
            <Row name="Digest" value={shortHash(trusted.reportDigest)} />
            <Row name="Replay" value={trusted.replayPass ? "Matched" : "Did not match"} />
          </>
        )}
      </dl>
      {report === null && (
        <p className="text-body-s text-ink-72">This revision has no test report yet.</p>
      )}
      {report !== null && trusted === null && (
        <p className="text-body-s text-ink-72">
          This report failed its integrity check, so its result is not shown.
        </p>
      )}
      {finding !== null && (
        <div className="space-y-2 border border-rule bg-paper-raised p-3">
          <span className="inline-block bg-accent px-2 py-1 font-mono text-micro font-medium uppercase text-paper-raised">
            {finding.code}
          </span>
          <p className="text-body text-ink">{finding.explanation}</p>
        </div>
      )}
      {excerpt.length > 0 && (
        <ol aria-label={`${title} trace`} className="space-y-1 border-y border-rule py-2">
          {excerpt.map((step) => (
            <li
              key={step.index}
              className={`grid grid-cols-[3.5ch_1fr] gap-x-3 font-mono text-micro ${step.accepted ? "text-ink" : "text-accent"}`}
            >
              <span className="text-muted tabular-nums">{stepNumber(step.index)}</span>
              <span>
                {describeAction(version.world, step.action)} ·{" "}
                {step.accepted ? "accepted" : "refused"} · {step.eventCode}
              </span>
            </li>
          ))}
        </ol>
      )}
      {trusted !== null && (
        <button
          type="button"
          className="self-start font-mono text-label uppercase text-accent"
          onClick={() => {
            onDownload(trusted);
          }}
        >
          Download report →
        </button>
      )}
    </article>
  );
}
