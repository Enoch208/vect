import { useCallback, useMemo, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { checkWorld } from "../../../verification/check-world.js";
import { sectionIds } from "../links.js";
import { Plan } from "../blueprint/Plan.js";
import { findingCallouts } from "../blueprint/plan-callouts.js";
import { TextButton } from "../primitives/Buttons.js";
import { CaptionBox } from "../primitives/CaptionBox.js";
import { BracketLabel } from "../primitives/Label.js";
import { LiveBoundary } from "../primitives/LiveBoundary.js";
import { Ruler } from "../primitives/Ruler.js";
import { mono } from "../primitives/type.js";
import { useReducedMotion, useScene } from "../use-scene.js";
import { ProductPanel } from "./ProductPanel.js";
import { walkthroughFrames, type Layer, type WalkFrame } from "./walkthrough-frames.js";

const hidden: Record<Layer, string> = {
  structure: "",
  detail: "[&_[data-layer=detail]]:opacity-0",
  agent: "[&_[data-layer=agent]]:opacity-0",
  dimension: "[&_[data-layer=dimension]]:opacity-0",
};

const layerNames: readonly Layer[] = ["structure", "detail", "agent", "dimension"];

function hiddenLayers(frame: WalkFrame): string {
  return layerNames
    .filter((layer) => !frame.layers.includes(layer))
    .map((layer) => hidden[layer])
    .join(" ");
}

type Props = { world: WorldSpec; twin: WorldSpec };

function Scene({ world, twin }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const frames = useMemo(() => walkthroughFrames(world), [world]);
  const [index, setIndex] = useState(reduced ? frames.length - 1 : 0);
  const [showFault, setShowFault] = useState(false);
  const fault = useMemo(() => {
    const check = checkWorld(twin);
    return {
      callouts: findingCallouts(twin, check),
      finding: check.solvability?.findings[0] ?? null,
    };
  }, [twin]);
  const build = useCallback(
    (element: HTMLElement) => {
      ScrollTrigger.create({
        trigger: element,
        start: "top top",
        end: `+=${String(frames.length * 55)}%`,
        pin: true,
        onUpdate: (self) => {
          setIndex(Math.min(frames.length - 1, Math.floor(self.progress * frames.length)));
        },
      });
    },
    [frames.length],
  );
  useScene(root, build);
  const frame = frames[index] ?? frames[0];
  if (frame === undefined) return null;
  const faultOn = frame.final && showFault;
  return (
    <div
      ref={root}
      className="relative flex min-h-[120vw] flex-col items-center justify-center bg-paper px-[12px] py-[calc(var(--spacing)*14)] lg:h-[calc(100dvh-16px)] lg:min-h-0 lg:px-3"
    >
      <Ruler />
      <BracketLabel className="absolute top-[calc(var(--spacing)*3.6)] left-[calc(var(--spacing)*3.6)]">
        {faultOn ? "Same level, key behind the door" : `Play · ${world.title}`}
      </BracketLabel>
      <div
        className={`w-full max-w-[calc(var(--spacing)*124)] transition-[translate,scale] duration-700 ease-[cubic-bezier(.4,0,0,1)] motion-reduce:transition-none ${frame.final ? "lg:-translate-x-[22%] lg:scale-[0.8]" : ""} [&_[data-layer]]:transition-opacity [&_[data-layer]]:duration-500 [&_[data-agent]]:transition-transform [&_[data-agent]]:duration-700 [&_[data-agent]]:ease-[cubic-bezier(.4,0,0,1)] ${faultOn ? "" : hiddenLayers(frame)}`}
      >
        {faultOn ? (
          <Plan world={twin} callouts={fault.callouts} dimensions={false} />
        ) : (
          <Plan world={world} state={frame.state} agent={frame.agent} path={frame.path} />
        )}
      </div>
      <div className="absolute bottom-[calc(var(--spacing)*3.6)] left-[calc(var(--spacing)*3.6)] z-10 flex flex-col items-start gap-3">
        <CaptionBox
          label={faultOn ? (fault.finding?.code ?? "Finding") : frame.label}
          hint={frame.final || reduced ? undefined : "Scroll to continue"}
        >
          {faultOn ? (fault.finding?.explanation ?? "") : frame.text}
        </CaptionBox>
        {frame.final && (
          <TextButton
            onClick={() => {
              setShowFault((on) => !on);
            }}
          >
            {faultOn ? "Back to the working world" : "Click on the fault"}
          </TextButton>
        )}
      </div>
      <div
        className={`absolute inset-y-0 right-0 z-20 hidden w-[32.5%] border-l border-rule transition-transform duration-700 ease-[cubic-bezier(.4,0,0,1)] motion-reduce:transition-none lg:flex ${frame.final ? "translate-x-0" : "translate-x-[101%]"}`}
      >
        <ProductPanel titleId="product-panel-title" className="w-full" />
      </div>
      <ol
        className={
          reduced
            ? `${mono.xs} mt-6 flex w-full max-w-[calc(var(--spacing)*124)] flex-col gap-1 pb-[calc(var(--spacing)*16)] text-ink`
            : "sr-only"
        }
      >
        {frames.map((item) => (
          <li key={`${item.label}-${item.text}`}>
            {item.label} <span className="normal-case">{item.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Walkthrough(props: Props) {
  return (
    <section id={sectionIds.walkthrough} aria-label="How it works" className="border-b border-rule">
      <LiveBoundary fallback={<Plan world={props.world} />}>
        <Scene {...props} />
      </LiveBoundary>
      <ProductPanel
        titleId="product-panel-title-stacked"
        className="border-t border-rule lg:hidden"
      />
    </section>
  );
}
