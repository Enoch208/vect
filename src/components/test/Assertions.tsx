import { HugeiconsIcon } from "@hugeicons/react";
import { CancelCircleIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { VerificationReport } from "../../contract/report.schema.js";

const labels: Record<string, string> = {
  "schema-valid": "World matches the schema",
  "structure-sound": "References and declarations are sound",
  "solver-solvable": "Solver found a way to finish",
  "agent-reached-goal": "Agent reached the goal",
  "replay-matches": "Replay matched step for step",
  "invariants-hold": "Invariants held on every step",
};

type Group = { title: string; ids: string[]; detail: (report: VerificationReport) => string };

const groups: Group[] = [
  {
    title: "Dependency check",
    ids: ["schema-valid", "structure-sound", "solver-solvable"],
    detail: (report) =>
      report.exploredStates === null
        ? "Bounded solver · not run, the structure has faults"
        : `Bounded solver · ${String(report.exploredStates)} states explored`,
  },
  {
    title: "Agent run",
    ids: ["agent-reached-goal", "replay-matches", "invariants-hold"],
    detail: (report) => `Rule-based playtest agent · ${String(report.trace.length)} steps`,
  },
];

export function Assertions({ report }: { report: VerificationReport }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map((group) => (
        <section
          key={group.title}
          aria-label={group.title}
          className="space-y-2 border border-rule p-3"
        >
          <h3 className="studio-label">{group.title}</h3>
          <p className="font-mono text-micro text-muted">{group.detail(report)}</p>
          <ul className="space-y-1">
            {group.ids.map((id) => {
              const passed = report.assertions.find((item) => item.id === id)?.passed === true;
              return (
                <li key={id} className="flex items-start gap-2 text-body-s">
                  <HugeiconsIcon
                    icon={passed ? Tick02Icon : CancelCircleIcon}
                    size={14}
                    strokeWidth={1.6}
                    aria-hidden
                    className={passed ? "mt-0.5 text-ink" : "mt-0.5 text-accent"}
                  />
                  <span
                    className={`font-mono text-micro uppercase ${passed ? "text-ink" : "text-accent"}`}
                  >
                    {passed ? "Pass" : "Fail"}
                  </span>
                  <span className="text-ink-72">{labels[id] ?? id}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
