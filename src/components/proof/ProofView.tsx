import type { VerificationReport } from "../../contract/report.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { downloadBlob } from "../../app/download.js";
import { useProjectStore } from "../../store/project-store.js";
import { useTestStore } from "../../store/test-store.js";
import type { WorldVersion } from "../../store/types.js";
import { reportStatusFor, verifyReportIntegrity } from "../../verification/report.js";
import { StatusChip } from "../test/StatusChip.js";
import { reportBundle } from "./bundle.js";
import { PatchLines } from "./PatchLines.js";
import { ReportCard } from "./ReportCard.js";

type ProofViewLayoutProps = {
  before: WorldVersion;
  after: WorldVersion;
  beforeReport: VerificationReport | null;
  afterReport: VerificationReport | null;
  onPlay: () => void;
  onReplay: () => void;
  onDownload: (world: WorldSpec, report: VerificationReport) => void;
};

export function ProofViewLayout({
  before,
  after,
  beforeReport,
  afterReport,
  onPlay,
  onReplay,
  onDownload,
}: ProofViewLayoutProps) {
  const fixed = afterReport !== null && reportStatusFor(after.world, afterReport) === "VERIFIED";
  const fileName =
    afterReport !== null && verifyReportIntegrity(afterReport)
      ? reportBundle(after.world, afterReport).fileName
      : null;
  return (
    <section aria-label="Proof" className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="studio-label">Proof</h2>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={after.origin === "live_ai" ? "AI_REPAIR" : "RULE_REPAIR"} />
          {fixed && (
            <span className="font-mono text-micro uppercase text-ink">Fixed with patch</span>
          )}
        </div>
      </header>
      <div
        data-testid="proof-columns"
        className="grid divide-rule border border-rule md:grid-cols-2 md:divide-x"
      >
        <div aria-label="Before" className="p-4">
          <ReportCard
            title="Before"
            version={before}
            report={beforeReport}
            onDownload={(report) => {
              onDownload(before.world, report);
            }}
          />
        </div>
        <div aria-label="After" className="space-y-4 p-4">
          {after.patch !== null && <PatchLines patch={after.patch} before={before.world} />}
          <ReportCard
            title="After"
            version={after}
            report={afterReport}
            onDownload={(report) => {
              onDownload(after.world, report);
            }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="studio-button studio-button-primary" onClick={onPlay}>
          Play repaired version
        </button>
        <button type="button" className="studio-button" onClick={onReplay}>
          Replay test
        </button>
      </div>
      {fileName !== null && (
        <p className="font-mono text-micro text-muted">
          Check it yourself: pnpm verify-report {fileName}
        </p>
      )}
    </section>
  );
}

export function ProofView({
  before,
  after,
  onPlay,
}: {
  before: WorldVersion;
  after: WorldVersion;
  onPlay: () => void;
}) {
  const reports = useProjectStore((store) => store.reports);
  const start = useTestStore((store) => store.start);
  return (
    <ProofViewLayout
      before={before}
      after={after}
      beforeReport={reports[before.revisionHash] ?? null}
      afterReport={reports[after.revisionHash] ?? null}
      onPlay={onPlay}
      onReplay={() => {
        start(after);
      }}
      onDownload={(world, report) => {
        const bundle = reportBundle(world, report);
        downloadBlob(bundle.fileName, new Blob([bundle.json], { type: "application/json" }));
      }}
    />
  );
}
