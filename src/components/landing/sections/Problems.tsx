import { ProblemDiagram } from "../blueprint/ProblemDiagram.js";
import { BracketLabel, MonoLabel } from "../primitives/Label.js";
import { body, dashedRule, display } from "../primitives/type.js";

const problems = [
  {
    title: "AI draws worlds, not games",
    body: "A scene that renders can still be a level nobody can finish.",
  },
  {
    title: "Nobody tests the logic",
    body: "Keys, doors and switches ship without anyone playing them first.",
  },
  {
    title: "Edits break things silently",
    body: "Move one key and the goal can become unreachable, with no warning.",
  },
  {
    title: "'It works' is a claim",
    body: "Without a run anyone can replay, there is nothing to check.",
  },
] as const;

export function Problems() {
  return (
    <section aria-labelledby="problems-title" className="border-b border-rule">
      <div className="grid gap-6 border-b border-rule p-[12px] lg:min-h-[calc(var(--spacing)*22.8)] lg:grid-cols-4 lg:p-3">
        <div className="flex flex-col gap-[calc(var(--spacing)*2.6)] lg:col-span-3">
          <MonoLabel>Problems</MonoLabel>
          <h2 id="problems-title" data-reveal="" className={`${display.l} max-w-[24ch]`}>
            AI makes worlds you can look at, not levels you can finish
          </h2>
        </div>
        <p
          className={`${body.m} max-w-[40ch] text-ink-72 lg:pt-[calc(var(--spacing)*3.2)] lg:text-[length:calc(var(--spacing)*1.75)]`}
        >
          A generated scene can look finished and still be impossible: a key behind its own door, a
          switch that opens nothing, a goal nobody can reach. Nobody finds out until someone plays
          it.
        </p>
      </div>
      <ol className="grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {problems.map((problem, index) => (
          <li
            key={problem.title}
            className="group flex min-h-[calc(var(--spacing)*30)] flex-col bg-paper lg:min-h-[calc(var(--spacing)*44)]"
          >
            <div className="flex h-[calc(var(--spacing)*5)] items-center px-[12px] lg:px-3">
              <BracketLabel>{String(index + 1).padStart(2, "0")}</BracketLabel>
            </div>
            <div aria-hidden className={dashedRule} />
            <ProblemDiagram index={index} />
            <div className="flex flex-1 flex-col justify-between gap-6 p-[12px] lg:p-3">
              <h3 data-reveal="" className={`${display.card} max-w-[11ch]`}>
                {problem.title}
              </h3>
              <p className={`${body.m} max-w-[34ch] text-ink-72`}>{problem.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
