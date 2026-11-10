import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import type { GenerateRequest } from "../../contract/api.schema.js";
import { difficulties, themes, type Difficulty, type Theme } from "../../contract/codes.js";
import { worldLimits } from "../../contract/limits.js";
import type { ClientFailure } from "../../store/api-client.js";
import { FailureNotice } from "./FailureNotice.js";
import { StatusBadge } from "./StatusBadge.js";

const examples = [
  "Build an abandoned observatory with a locked control room, a key in the library, and a portal that opens when the control switch is activated.",
  "Create a ruined jungle temple with four connected chambers, a pressure switch, a locked stone door and a treasure objective.",
  "Make a futuristic laboratory where the player must find an access card, disable a barrier and activate the exit.",
];

type Props = {
  prompt: string;
  onPrompt: (prompt: string) => void;
  onGenerate: (request: GenerateRequest) => void;
  onOpenExample: () => void;
  onRetry: () => void;
  phase: "idle" | "requesting" | "checking";
  elapsed: number;
  modelId: string | null;
  failure: ClientFailure | null;
};

export function GenerationPanel(props: Props) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const length = props.prompt.trim().length;
  const busy = props.phase !== "idle";
  const valid = length >= worldLimits.promptLength.min && length <= worldLimits.promptLength.max;
  return (
    <main className="studio-entry">
      <section className="flex flex-col justify-between gap-10 border-rule p-[26px] lg:border-r">
        <div>
          <p className="studio-label mb-6 text-muted">[01] Describe your world</p>
          <h1 className="max-w-[530px] font-display text-[40px] leading-none font-semibold tracking-[-0.02em] uppercase">
            Build it.
            <br />
            Play it.
            <br />
            Prove it.
          </h1>
          <p className="mt-6 max-w-[360px] text-body text-ink-72">
            Describe rooms, keys and switches. Create a puzzle you can play, test and repair.
          </p>
        </div>
        <div className="space-y-4">
          <p className="studio-label text-muted">Start with a prompt</p>
          {examples.map((prompt, index) => (
            <button
              key={prompt}
              type="button"
              disabled={busy}
              className="group flex w-full items-start gap-4 border-t border-rule py-4 text-left text-body disabled:opacity-50"
              onClick={() => {
                props.onPrompt(prompt);
              }}
            >
              <span className="studio-label text-muted">0{index + 1}</span>
              <span className="flex-1">{prompt}</span>
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                size={16}
                aria-hidden
                className="shrink-0 text-accent"
              />
            </button>
          ))}
        </div>
      </section>
      <section className="flex flex-col justify-between gap-8 p-[26px]">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid && !busy)
              props.onGenerate({
                prompt: props.prompt,
                theme,
                difficulty,
                clientRequestId: crypto.randomUUID(),
              });
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="world-prompt" className="studio-label">
              Your idea
            </label>
            <span id="prompt-count" className="studio-label text-muted">
              {length} / {worldLimits.promptLength.max}
            </span>
          </div>
          <textarea
            id="world-prompt"
            className="studio-field min-h-[190px] w-full resize-y text-body"
            placeholder="An observatory with a locked control room…"
            value={props.prompt}
            maxLength={worldLimits.promptLength.max}
            disabled={busy}
            onChange={(event) => {
              props.onPrompt(event.target.value);
            }}
            aria-describedby="prompt-count prompt-scope"
          />
          <p id="prompt-scope" className="text-body-s text-muted">
            10–1,000 characters. Supports 4–10 rooms, keys, doors, switches, barriers and one
            objective.
          </p>
          <fieldset disabled={busy} className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="studio-label block">Theme</span>
              <select
                className="studio-field w-full"
                value={theme ?? ""}
                onChange={(event) => {
                  setTheme(themes.find((value) => value === event.target.value) ?? null);
                }}
              >
                <option value="">From your prompt</option>
                {themes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="studio-label block">Difficulty</span>
              <select
                className="studio-field w-full"
                value={difficulty ?? ""}
                onChange={(event) => {
                  setDifficulty(difficulties.find((value) => value === event.target.value) ?? null);
                }}
              >
                <option value="">From your prompt</option>
                {difficulties.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          <button
            type="submit"
            disabled={!valid || busy}
            className="studio-button studio-button-primary w-full justify-between"
          >
            Generate <HugeiconsIcon icon={ArrowRight02Icon} size={18} aria-hidden />
          </button>
          {busy && (
            <div role="status" className="flex flex-wrap items-center gap-3">
              <StatusBadge status="RUNNING" />
              <span>
                {props.phase === "checking"
                  ? "Checking the world"
                  : props.modelId
                    ? `Generating with ${props.modelId}`
                    : "Generating world"}{" "}
                · <span className="font-mono tabular-nums">{props.elapsed}s</span>
              </span>
            </div>
          )}
          {props.failure && (
            <FailureNotice
              failure={props.failure}
              onRetry={props.onRetry}
              onSuggestion={props.onPrompt}
            />
          )}
        </form>
        <div className="space-y-4 border-t border-rule pt-5">
          <p className="text-body-s text-muted">
            Your description is sent to the configured OpenAI model when you generate. Projects stay
            in this browser.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <StatusBadge status="EXAMPLE" />
            <button type="button" className="studio-button" onClick={props.onOpenExample}>
              Open example world <HugeiconsIcon icon={ArrowRight02Icon} size={16} aria-hidden />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
