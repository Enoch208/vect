import { useMemo, type ReactNode } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { checkWorld } from "../../../verification/check-world.js";
import { sectionIds } from "../links.js";
import { Plan } from "../blueprint/Plan.js";
import { findingCallouts } from "../blueprint/plan-callouts.js";
import { TextButton } from "../primitives/Buttons.js";
import { BracketLabel } from "../primitives/Label.js";
import { LiveBoundary } from "../primitives/LiveBoundary.js";
import { ProductFigure } from "./ProductFigure.js";
import { body, display } from "../primitives/type.js";

const gridPaper =
  "bg-[linear-gradient(to_right,var(--color-rule-soft)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-rule-soft)_1px,transparent_1px)] bg-[size:calc(var(--spacing)*6)_calc(var(--spacing)*6)]";

type CardProps = {
  index: number;
  title: string;
  text: string;
  action: ReactNode;
  figure: ReactNode;
};

function ProductCard({ index, title, text, action, figure }: CardProps) {
  return (
    <article className="grid grid-cols-1 border-b border-rule lg:min-h-[calc(var(--spacing)*64)] lg:grid-cols-[25%_42.5%_32.5%]">
      <div className="flex flex-col border-rule lg:border-r">
        <div className="hidden flex-1 lg:block" />
        <div className="flex flex-col gap-[calc(var(--spacing)*5)] border-y border-rule p-[12px] lg:min-h-[calc(var(--spacing)*17.3)] lg:justify-between lg:p-3">
          <BracketLabel>{String(index).padStart(2, "0")}</BracketLabel>
          <h3 data-reveal="" className={display.m}>
            {title}
          </h3>
        </div>
        <div className="hidden flex-1 lg:block" />
      </div>
      <div
        className={`flex items-center justify-center p-[calc(var(--spacing)*4)] max-lg:min-h-[80vw] ${gridPaper}`}
      >
        <ProductFigure kind={index === 1 ? "studio" : "proof"}>{figure}</ProductFigure>
      </div>
      <div className="flex flex-col border-rule lg:border-l">
        <div className="hidden flex-1 lg:block" />
        <div className="flex flex-col border-y border-rule lg:min-h-[calc(var(--spacing)*17.3)]">
          <p
            className={`${body.m} flex-1 p-[12px] text-ink-72 lg:p-3 lg:text-[length:calc(var(--spacing)*1.75)]`}
          >
            {text}
          </p>
          <div className="border-t border-rule px-[12px] py-[calc(var(--spacing)*1.4)] lg:px-3">
            {action}
          </div>
        </div>
        <div className="hidden flex-1 lg:block" />
      </div>
    </article>
  );
}

type ProductProps = {
  world: WorldSpec;
  twin: WorldSpec;
  onOpenStudio: () => void;
  onOpenExample: () => void;
};

function TwinPlan({ twin }: { twin: WorldSpec }) {
  const callouts = useMemo(() => findingCallouts(twin, checkWorld(twin)), [twin]);
  return <Plan world={twin} callouts={callouts} dimensions={false} />;
}

export function Product({ world, twin, onOpenStudio, onOpenExample }: ProductProps) {
  return (
    <section id={sectionIds.product} aria-label="Product" className="border-b border-rule">
      <ProductCard
        index={1}
        title="Studio"
        text="Describe a world and play it in 3D, then change it in plain words. Every revision is kept and labelled for what made it: live AI, the parser or an example."
        action={<TextButton onClick={onOpenStudio}>Open the studio</TextButton>}
        figure={<Plan world={world} dimensions={false} />}
      />
      <ProductCard
        index={2}
        title="Proof view"
        text="Each report names its world revision, seed, trace and digest, and replays to the same result. Edit the world and the report is marked stale."
        action={<TextButton onClick={onOpenExample}>Open example world</TextButton>}
        figure={
          <LiveBoundary fallback={<Plan world={twin} dimensions={false} />}>
            <TwinPlan twin={twin} />
          </LiveBoundary>
        }
      />
    </section>
  );
}
