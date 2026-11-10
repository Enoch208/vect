import { useMemo, useState } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { sectionIds } from "../links.js";
import { Accordion } from "../primitives/Accordion.js";
import { BracketLabel } from "../primitives/Label.js";
import { LiveBoundary } from "../primitives/LiveBoundary.js";
import { display } from "../primitives/type.js";
import { Elevation } from "../blueprint/Elevation.js";
import { caseFigures, useCaseCopy } from "./use-case-figures.js";

type UseCasesProps = { world: WorldSpec; twin: WorldSpec };

function Figures({ world, twin, shown }: UseCasesProps & { shown: number }) {
  const figures = useMemo(() => caseFigures(world, twin), [world, twin]);
  return figures.map((figure, index) => (
    <div
      key={useCaseCopy[index]?.title ?? String(index)}
      aria-hidden={index !== shown}
      className={`absolute inset-0 flex items-center justify-center p-[calc(var(--spacing)*8)] transition-opacity duration-500 motion-reduce:transition-none ${index === shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div className="w-full max-w-[calc(var(--spacing)*60)]">{figure}</div>
    </div>
  ));
}

function Rows({ world, twin }: UseCasesProps) {
  const [open, setOpen] = useState<number | null>(0);
  const shown = open ?? 0;
  return (
    <>
      <div className="relative flex min-h-[90vw] items-center justify-center overflow-hidden border-rule p-[calc(var(--spacing)*6)] max-lg:order-last max-lg:border-t lg:min-h-0 lg:border-r">
        <BracketLabel className="absolute top-[calc(var(--spacing)*2.4)] left-[calc(var(--spacing)*2.4)]">
          {`Fig. ${String(shown + 10)} · ${useCaseCopy[shown]?.title ?? ""}`}
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
        <div className="flex min-h-[calc(var(--spacing)*38)] items-start border-b border-rule p-[12px] lg:pt-[calc(var(--spacing)*1)] lg:pl-[calc(var(--spacing)*15.4)]">
          <h2 id="use-cases-title" data-reveal="" className={`${display.l} max-w-[14ch]`}>
            Made for people who build worlds
          </h2>
        </div>
        <Accordion items={useCaseCopy} defaultOpen={0} onOpenChange={setOpen} />
      </div>
    </>
  );
}

export function UseCases(props: UseCasesProps) {
  return (
    <section
      id={sectionIds.useCases}
      aria-labelledby="use-cases-title"
      className="grid border-b border-rule lg:grid-cols-2"
    >
      <Rows {...props} />
    </section>
  );
}
