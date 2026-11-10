import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  ArtificialIntelligence04Icon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import type { EditPreview } from "../../app/check-edit.js";
import type { WorldVersion } from "../../store/types.js";
import { PatchDiff } from "./PatchDiff.js";
import { StatusBadge } from "./StatusBadge.js";

export function EditPreviewCard({
  base,
  preview,
  onApply,
  onDiscard,
}: {
  base: WorldVersion;
  preview: EditPreview;
  onApply: (version: WorldVersion) => void;
  onDiscard: () => void;
}) {
  const live = preview.version.origin === "live_ai";
  return (
    <>
      <div className="space-y-3">
        <StatusBadge status="DRAFT" />
        <p className="flex items-center gap-2 font-mono text-micro uppercase">
          <HugeiconsIcon
            icon={live ? ArtificialIntelligence04Icon : SourceCodeIcon}
            size={14}
            aria-hidden
          />
          {live
            ? "AI edit proposal"
            : preview.version.origin === "sample_fixture"
              ? "Example edit"
              : "Local parser: limited commands"}
          {preview.version.modelId ? ` · ${preview.version.modelId}` : ""}
        </p>
        <p
          className="font-mono text-micro tabular-nums"
          title={`${base.revisionHash} → ${preview.version.revisionHash}`}
        >
          {base.revisionHash.slice(0, 12)} → {preview.version.revisionHash.slice(0, 12)}
        </p>
      </div>
      {preview.version.patch && <PatchDiff patch={preview.version.patch} before={base.world} />}
      <div className="flex gap-3">
        <button
          type="button"
          className="studio-button studio-button-primary"
          onClick={() => {
            onApply(preview.version);
          }}
        >
          Apply revision
        </button>
        <button type="button" className="studio-button" onClick={onDiscard}>
          Discard
        </button>
      </div>
      <div className="space-y-3 border-t border-rule pt-4">
        <h3 className="studio-label">Dependency check</h3>
        <p className="flex items-center gap-2">
          <HugeiconsIcon
            icon={
              preview.solvability?.status === "SOLVABLE" ? CheckmarkCircle02Icon : AlertCircleIcon
            }
            size={16}
            aria-hidden
          />
          {preview.solvability?.status === "SOLVABLE"
            ? "Solvable"
            : preview.solvability?.status === "PROVEN_UNREACHABLE"
              ? "Unreachable"
              : "Inconclusive"}
        </p>
        <p className="text-body-s text-muted">
          Run Test after applying the edit to create a verification report.
        </p>
        {preview.warnings.map((warning, index) => (
          <p key={`${String(index)}-${warning}`} className="border-l-2 border-accent pl-3">
            {warning}
          </p>
        ))}
      </div>
      <p className="text-body-s text-muted">
        Applying creates a new version and starts a fresh play session. Earlier versions and their
        reports remain in history.
      </p>
    </>
  );
}
