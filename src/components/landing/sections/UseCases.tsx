import { useMemo, useState } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { sectionIds } from "../links.js";
import { Accordion } from "../primitives/Accordion.js";
import { BracketLabel } from "../primitives/Label.js";
import { LiveBoundary } from "../primitives/LiveBoundary.js";
import { display } from "../primitives/type.js";
import { Elevation } from "../blueprint/Elevation.js";
import { caseFigures, useCaseCopy } from "./use-case-figures.js";
import { UseCaseArtwork } from "./UseCaseArtwork.js";

type UseCasesProps = { world: WorldSpec; twin: WorldSpec };

function Figures({ world, twin, shown }: UseCasesProps & { shown: number }) {
  const figures = useMemo(() => caseFigures(world, twin), [world, twin]);
  return figures.map((figure, index) => (
    <div
      key={useCaseCopy[index]?.title ?? String(index)}
      aria-hidden={index !== shown || shown === 0 || shown === 7}
      className={`absolute right-[5%] bottom-[6%] left-[5%] flex items-center justify-center border border-rule bg-paper/95 p-[calc(var(--spacing)*3)] transition-[opacity,translate] duration-400 motion-reduce:translate-y-0 motion-reduce:transition-none ${index === shown && shown !== 0 && shown !== 7 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <div className="w-full max-w-[calc(var(--spacing)*60)]">{figure}</div>
    </div>
  ));
}

function Rows({ world, twin }: UseCasesProps) {
  const [shown, setShown] = useState(0);
  function selectRow(next: number | null): void {
    if (next !== null) setShown(next);
  }
  return (
    <>
      <div className="relative flex min-h-[115vw] items-center justify-center overflow-hidden border-rule p-[calc(var(--spacing)*6)] max-lg:border-b lg:min-h-[calc(var(--spacing)*100)] lg:border-r">
        <UseCaseArtwork shown={shown} />
        <span className="absolute top-3 left-3 bg-paper/90 px-2 py-1 font-mono text-[10px] uppercase text-muted">
          Concept study
        </span>
        <BracketLabel className="absolute top-[calc(var(--spacing)*6)] left-[calc(var(--spacing)*2.4)] bg-paper/90 px-2 py-1">
          {`Play · ${useCaseCopy[shown]?.title ?? ""}`}
        </BracketLabel>
        <LiveBoundary
          fallback={
            <div className="w-full max-w-[calc(var(--spacing)*60)]">
              <Elevation world={world} />
            </div>
          }
        >
          <Figures world={world} twin={twin} shown={shown} />
        </LiveBoundary>
      </div>
      <div className="flex flex-col">
        <div className="flex items-start border-b border-rule p-[12px] pt-[calc(var(--spacing)*4)] pb-[calc(var(--spacing)*6)] lg:min-h-[calc(var(--spacing)*38)] lg:pt-[calc(var(--spacing)*1)] lg:pl-[calc(var(--spacing)*15.4)]">
          <h2 id="use-cases-title" data-reveal="" className={`${display.l} max-w-[14ch]`}>
            Made for people who build worlds
          </h2>
        </div>
        <Accordion items={useCaseCopy} defaultOpen={0} onOpenChange={selectRow} />
      </div>
    </>
  );
}

export function UseCases(props: UseCasesProps) {
  return (
    <section
      id={sectionIds.useCases}
      aria-labelledby="use-cases-title"
      className="grid grid-cols-1 border-b border-rule lg:grid-cols-2"
    >
      <Rows {...props} />
    </section>
  );
}
