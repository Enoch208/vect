import type { WorldSpec } from "../../contract/world.schema.js";
import type { PacedStep } from "../../store/test-store.js";
import { describeAction, stepNumber } from "./format.js";

export function Timeline({ world, steps }: { world: WorldSpec; steps: readonly PacedStep[] }) {
  if (steps.length === 0) {
    return <p className="text-body-s text-muted">The agent has not taken a step yet.</p>;
  }
  return (
    <ol
      aria-label="Agent timeline"
      className="divide-y divide-dashed divide-rule-soft border-y border-rule"
    >
      {steps.map(({ step, summary }) => (
        <li
          key={step.index}
          data-accepted={step.accepted}
          className={`grid grid-cols-[3.5ch_1fr] gap-x-3 px-3 py-2 ${
            step.accepted ? "" : "border-l-2 border-accent bg-accent-soft"
          }`}
        >
          <span className="font-mono text-micro text-muted tabular-nums">
            {stepNumber(step.index)}
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-body-s text-ink">{describeAction(world, step.action)}</p>
            <p className="text-body-s text-ink-72">{summary}</p>
            <p className="font-mono text-micro tabular-nums">
              <span className={step.accepted ? "text-muted" : "text-accent"}>
                {step.accepted ? "accepted" : "refused"}
              </span>
              <span className="text-muted"> · {step.eventCode}</span>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
