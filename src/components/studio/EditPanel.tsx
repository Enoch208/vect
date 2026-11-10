import { EditPreviewCard } from "./EditPreviewCard.js";
import { useEffect, useRef, useState } from "react";
import { checkEditResponse, type EditPreview } from "../../app/check-edit.js";
import type { ApiClient, ClientFailure } from "../../store/api-client.js";
import type { WorldVersion } from "../../store/types.js";
import { worldLimits } from "../../contract/limits.js";
import { FailureNotice } from "./FailureNotice.js";
import { StatusBadge } from "./StatusBadge.js";

type Props = {
  api: ApiClient;
  version: WorldVersion;
  selectedEntityIds: string[];
  onPreview: () => void;
  onApply: (version: WorldVersion) => void;
  onDiscard: () => void;
  onClose: () => void;
};

export function EditPanel(props: Props) {
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ClientFailure | null>(null);
  const [preview, setPreview] = useState<EditPreview | null>(null);
  const pending = useRef(false);
  const sequence = useRef(0);
  const valid =
    instruction.trim().length >= worldLimits.promptLength.min &&
    instruction.trim().length <= worldLimits.promptLength.max;

  useEffect(() => {
    const current = sequence;
    return () => {
      current.current += 1;
    };
  }, []);

  async function propose() {
    if (pending.current || !valid) return;
    pending.current = true;
    const id = ++sequence.current;
    setBusy(true);
    setFailure(null);
    try {
      const result = await props.api.edit({
        world: props.version.world,
        baseRevisionHash: props.version.revisionHash,
        instruction,
        selectedEntityIds: props.selectedEntityIds,
      });
      if (sequence.current !== id) return;
      if (!result.ok) {
        setFailure(result.failure);
        return;
      }
      const checked = checkEditResponse(props.version, instruction, result.data);
      if (!checked.ok) {
        setFailure(checked.failure);
        return;
      }
      setPreview(checked.data);
      props.onPreview();
    } catch {
      if (sequence.current === id)
        setFailure({
          code: "INTERNAL",
          message: "This edit could not be previewed. Request it again.",
          retryable: true,
          suggestion: null,
          status: null,
        });
    } finally {
      if (sequence.current === id) {
        pending.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <aside
      aria-label="Edit world"
      className="space-y-5 overflow-y-auto border-r border-rule p-4 text-body"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="studio-label">Edit world</h2>
        <button type="button" className="studio-label text-accent" onClick={props.onClose}>
          Close
        </button>
      </div>
      {props.selectedEntityIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {props.selectedEntityIds.map((id) => (
            <span key={id} className="border border-rule px-2 py-1 font-mono text-micro">
              {props.version.world.entities.find((entity) => entity.id === id)?.label ?? id}
            </span>
          ))}
        </div>
      )}
      {preview ? (
        <EditPreviewCard
          base={props.version}
          preview={preview}
          onApply={props.onApply}
          onDiscard={() => {
            setPreview(null);
            props.onDiscard();
          }}
        />
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void propose();
          }}
        >
          <label htmlFor="edit-instruction" className="studio-label block">
            What should change?
          </label>
          <textarea
            id="edit-instruction"
            className="studio-field min-h-[180px] w-full resize-y"
            maxLength={worldLimits.promptLength.max}
            value={instruction}
            disabled={busy}
            onChange={(event) => {
              setInstruction(event.target.value);
            }}
            placeholder="Put the access key inside the room that it unlocks."
            aria-describedby="edit-length"
          />
          <p id="edit-length" className="font-mono text-micro text-muted">
            {instruction.trim().length} / {worldLimits.promptLength.max}
          </p>
          <button
            type="submit"
            disabled={!valid || busy}
            className="studio-button studio-button-primary w-full"
          >
            Preview edit
          </button>
          {busy && (
            <p role="status">
              <StatusBadge status="RUNNING" detail="Requesting edit" />
            </p>
          )}
          {failure && (
            <FailureNotice
              failure={failure}
              onRetry={() => {
                void propose();
              }}
              onSuggestion={setInstruction}
            />
          )}
          <p className="text-body-s text-muted">
            Your instruction, current world and selection are sent to the configured OpenAI model
            when you request a preview.
          </p>
        </form>
      )}
    </aside>
  );
}
