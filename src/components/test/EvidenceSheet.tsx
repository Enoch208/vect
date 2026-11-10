import { useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import type { VerificationReport } from "../../contract/report.schema.js";
import { shortHash } from "./format.js";

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <span className="inline-flex items-center gap-2">
      <span title={value}>{shortHash(value)}</span>
      <button
        type="button"
        aria-label={`Copy the full ${label}`}
        className="text-muted hover:text-ink"
        onClick={() => {
          navigator.clipboard.writeText(value).then(
            () => {
              setCopied("copied");
            },
            () => {
              setCopied("failed");
            },
          );
        }}
      >
        <HugeiconsIcon icon={Copy01Icon} size={12} strokeWidth={1.6} aria-hidden />
      </button>
      {copied !== "idle" && <span>{copied === "copied" ? "Copied" : "Copy failed"}</span>}
    </span>
  );
}

export function EvidenceSheet({ report }: { report: VerificationReport }) {
  const rows: Array<[string, ReactNode]> = [
    ["World", report.worldId],
    [
      "Revision",
      <CopyValue key="revision" label="revision hash" value={report.worldRevisionHash} />,
    ],
    ["Seed", String(report.initialSeed)],
    ["Report", report.reportId],
    ["Digest", <CopyValue key="digest" label="report digest" value={report.reportDigest} />],
    ["Engine", report.engineVersion],
    ["Verifier", report.verifierVersion],
    ["Replay", report.replayPass ? "Matched" : "Did not match"],
    ["Elapsed", `${String(Math.round(report.elapsedMs))} ms`],
  ];
  return (
    <section aria-label="Evidence" className="space-y-2">
      <h3 className="studio-label text-muted">Spec sheet</h3>
      <dl className="space-y-1 font-mono text-micro tabular-nums">
        {rows.map(([key, value]) => (
          <div key={key} className="flex">
            <dt className="w-20 shrink-0 uppercase text-muted">{key}</dt>
            <dd className="flex min-w-0 text-ink">
              <span aria-hidden className="pr-[1ch] text-muted">
                :
              </span>
              <span className="min-w-0 break-all">{value}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-body-s text-muted">
        The digest is a SHA-256 integrity check of the report body, not a signature.
      </p>
    </section>
  );
}
