import { useState } from "react";
import { downloadBlob } from "../../app/download.js";
import type { VerificationReport } from "../../contract/report.schema.js";
import { exportBundle } from "../../store/persistence.js";
import type { WorldVersion } from "../../store/types.js";
import { StatusBadge } from "./StatusBadge.js";

export function ExportButton({
  version,
  report,
}: {
  version: WorldVersion;
  report: VerificationReport | null;
}) {
  const [error, setError] = useState<string | null>(null);
  function download() {
    try {
      downloadBlob(
        `vect-${version.world.id}-${version.revisionHash.slice(0, 12)}.json`,
        exportBundle(version, report),
      );
      setError(null);
    } catch {
      setError("The world or report failed validation and could not be exported.");
    }
  }
  return (
    <div>
      <button type="button" className="studio-button" onClick={download}>
        Export world
      </button>
      {error && (
        <p role="alert" className="mt-2 flex gap-2 text-body-s">
          <StatusBadge status="ERROR" />
          {error}
        </p>
      )}
    </div>
  );
}
