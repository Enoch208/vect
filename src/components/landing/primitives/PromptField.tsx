import { useId, useState, type SubmitEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { worldLimits } from "../../../contract/limits.js";
import { body, mono } from "./type.js";

type PromptFieldProps = {
  onPrompt: (prompt: string) => void;
  className?: string;
};

export function canSubmitPrompt(text: string): boolean {
  const length = text.trim().length;
  return length >= worldLimits.promptLength.min && length <= worldLimits.promptLength.max;
}

export function PromptField({ onPrompt, className = "" }: PromptFieldProps) {
  const [text, setText] = useState("");
  const id = useId();
  const ready = canSubmitPrompt(text);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ready) onPrompt(text.trim());
  }

  return (
    <form onSubmit={submit} className={`flex flex-col gap-[calc(var(--spacing)*0.8)] ${className}`}>
      <label htmlFor={id} className={`${mono.xs} text-muted`}>
        Describe a world
      </label>
      <div className="flex h-[calc(var(--spacing)*5.2)] border border-rule bg-paper-raised focus-within:border-ink">
        <input
          id={id}
          value={text}
          maxLength={worldLimits.promptLength.max}
          onChange={(event) => {
            setText(event.target.value);
          }}
          placeholder="A castle where the key to the tower is hidden in the crypt"
          className={`${body.m} min-w-0 flex-1 bg-transparent px-[calc(var(--spacing)*1.4)] text-ink outline-none placeholder:font-mono placeholder:text-[0.85em] placeholder:text-faint placeholder:uppercase`}
        />
        <button
          type="submit"
          disabled={!ready}
          aria-label="Build this world in the studio"
          className="flex w-[calc(var(--spacing)*5.2)] items-center justify-center border-l border-rule text-ink transition-colors enabled:bg-accent enabled:text-paper-raised enabled:hover:bg-ink disabled:cursor-not-allowed disabled:text-faint focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
        >
          <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden size={16} strokeWidth={1.5} />
        </button>
      </div>
      <p className={`${mono.xs} text-faint`}>
        {`${String(worldLimits.promptLength.min)}–${String(worldLimits.promptLength.max)} characters · opens the studio`}
      </p>
    </form>
  );
}
