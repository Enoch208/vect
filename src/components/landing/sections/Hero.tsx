import { useMemo, useRef } from "react";
import { Book02Icon } from "@hugeicons/core-free-icons";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { drawingAspect, Elevation } from "../blueprint/Elevation.js";
import { TextButton } from "../primitives/Buttons.js";
import { BracketLabel, MonoLabel } from "../primitives/Label.js";
import { Ruler } from "../primitives/Ruler.js";
import { StatusChip } from "../primitives/StatusChip.js";
import { body, display, mono } from "../primitives/type.js";
import { aiLabel, heroEngraving } from "../landing-assets.js";
import { heroDrawingAttribute } from "./Loader.js";
import { useScene } from "../use-scene.js";
import { flattenElevation } from "./hero-motion.js";
import { PointerLines } from "./PointerLines.js";

const promises = ["Playable worlds", "Real tests", "Proven fixes"] as const;

type HeroProps = {
  world: WorldSpec;
  drawingVisible: boolean;
  onOpenStudio: () => void;
  onOpenExample: () => void;
};

const corner = "absolute z-10 flex flex-col gap-1";

export function Hero({ world, drawingVisible, onOpenStudio, onOpenExample }: HeroProps) {
  const root = useRef<HTMLElement>(null);
  useScene(root, flattenElevation);
  const aspect = useMemo(() => drawingAspect(world), [world]);
  const drawingTarget = { [heroDrawingAttribute]: "" };
  const shading =
    world.id === heroEngraving.worldId
      ? { src: heroEngraving.src, alt: `${aiLabel} of ${heroEngraving.subject}` }
      : undefined;
  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="flex flex-col border-b border-rule lg:min-h-[calc(100dvh-16px-56px)]"
    >
      {shading !== undefined && <link rel="preload" as="image" href={shading.src} />}
      <div className="relative flex min-h-[110vw] flex-1 items-center justify-center border-b border-rule lg:min-h-0">
        <Ruler />
        <PointerLines />
        <div
          data-intro="fade"
          className={`${corner} top-[calc(var(--spacing)*3.6)] left-[calc(var(--spacing)*3.6)]`}
        >
          <BracketLabel>Level 01</BracketLabel>
          <MonoLabel className="text-ink">{world.title}</MonoLabel>
          {shading !== undefined && (
            <span data-ai-label="shading" className={`${mono.xs} text-muted`}>
              {aiLabel}
            </span>
          )}
        </div>
        <div
          data-intro="fade"
          className={`${corner} top-[calc(var(--spacing)*3.6)] right-[calc(var(--spacing)*3.6)] items-end`}
        >
          <StatusChip tone="neutral" icon={Book02Icon}>
            Example world
          </StatusChip>
        </div>
        <div
          {...drawingTarget}
          className={`[--hero-drawing-max:94%] lg:[--hero-drawing-max:84%] ${drawingVisible ? "visible" : "invisible"}`}
          style={{
            width: `min(var(--hero-drawing-max), calc((100dvh - 196px) * ${aspect.toFixed(4)}))`,
          }}
        >
          <Elevation world={world} architectural {...(shading === undefined ? {} : { shading })} />
        </div>
        <p
          className={`${body.s} absolute bottom-[calc(var(--spacing)*3.6)] left-[calc(var(--spacing)*3.6)] max-w-[28ch] text-ink`}
        >
          Find the key. Open the locked door. Reach the goal.
        </p>
        <span
          className={`${mono.xs} absolute bottom-[calc(var(--spacing)*3.6)] right-[calc(var(--spacing)*3.6)] text-muted max-lg:hidden`}
        >
          {shading === undefined
            ? "Scroll to reveal the construction lines ↓"
            : "Scroll to reveal the drawing ↓"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-px bg-rule lg:grid-cols-[58%_27%_15%]">
        <div className="bg-paper p-[12px] lg:p-3">
          <h1 id="hero-title" data-intro="lines" className={display.xl}>
            <span className="block">The AI game studio </span>
            <span className="block">that plays what it builds</span>
          </h1>
        </div>
        <div className="flex flex-col justify-between gap-3 bg-paper p-[12px] lg:p-3">
          <ul className="flex flex-col gap-[calc(var(--spacing)*0.6)]">
            {promises.map((promise, index) => (
              <li
                key={promise}
                data-intro="fade"
                className={`${mono.label} flex gap-[1ch] text-ink`}
              >
                <span className="text-faint">[{String(index + 1).padStart(2, "0")}]</span>
                {promise}
              </li>
            ))}
          </ul>
          <p data-intro="fade" className={`${body.m} max-w-[34ch] text-ink-72`}>
            Describe a world. Vect builds it, plays it, finds what's broken and proves the fix.
          </p>
        </div>
        <div className="flex flex-col items-start justify-between gap-4 bg-paper p-[12px] lg:p-3">
          <div data-intro="fade">
            <TextButton onClick={onOpenStudio}>Open studio</TextButton>
          </div>
          <div data-intro="fade">
            <TextButton onClick={onOpenExample}>Open example world</TextButton>
          </div>
        </div>
      </div>
    </section>
  );
}
