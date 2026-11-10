import type { ClientFailure } from "../../store/api-client.js";
import { StatusBadge } from "./StatusBadge.js";

export function FailureNotice({
  failure,
  onRetry,
  onSuggestion,
}: {
  failure: ClientFailure;
  onRetry: () => void;
  onSuggestion?: (suggestion: string) => void;
}) {
  if (failure.code === "ABORTED") return null;
  return (
    <div role="alert" className="space-y-3 border border-accent bg-accent-soft p-4">
      <StatusBadge status="ERROR" />
      <p>{failure.message}</p>
      {failure.code === "RATE_LIMITED" && (
        <p>Please wait before trying again. You can still open the example world.</p>
      )}
      {failure.suggestion && <p>{failure.suggestion}</p>}
      <div className="flex flex-wrap gap-3">
        {(failure.retryable ||
          failure.code === "MODEL_NOT_CONFIGURED" ||
          failure.code.startsWith("PROVIDER_")) && (
          <button type="button" className="studio-button" onClick={onRetry}>
            Retry
          </button>
        )}
        {failure.code === "GENERATION_UNSUPPORTED" && failure.suggestion && onSuggestion && (
          <button
            type="button"
            className="studio-button"
            onClick={() => {
              if (failure.suggestion) onSuggestion(failure.suggestion);
            }}
          >
            Use this suggestion
          </button>
        )}
      </div>
    </div>
  );
}
