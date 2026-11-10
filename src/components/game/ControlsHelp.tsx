import { useEffect, useRef } from "react";

export function ControlsHelp({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="controls-title"
      onCancel={onClose}
      className="m-auto w-[420px] max-w-[90vw] border border-rule bg-paper p-[26px] text-ink backdrop:bg-ink/30"
    >
      <h2
        id="controls-title"
        className="mb-6 font-display text-[26.7px] leading-none font-semibold uppercase"
      >
        Controls
      </h2>
      <dl className="space-y-4 text-body">
        <div className="flex justify-between gap-5">
          <dt>Move</dt>
          <dd className="font-mono">WASD / Arrow keys</dd>
        </div>
        <div className="flex justify-between gap-5">
          <dt>Interact with an object here</dt>
          <dd className="font-mono">E</dd>
        </div>
        <div className="flex justify-between gap-5">
          <dt>Move or select</dt>
          <dd>Click a room or object</dd>
        </div>
        <div className="flex justify-between gap-5">
          <dt>Return to the studio</dt>
          <dd className="font-mono">Esc</dd>
        </div>
        <div className="flex justify-between gap-5">
          <dt>Show controls</dt>
          <dd className="font-mono">?</dd>
        </div>
      </dl>
      <p className="my-6 text-body-s text-muted">
        Doors and barriers follow the world’s rules. If a route is blocked, find the item or switch
        it needs.
      </p>
      <button type="button" className="studio-button w-full" onClick={onClose}>
        Close controls
      </button>
    </dialog>
  );
}
