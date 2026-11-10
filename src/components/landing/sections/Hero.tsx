import { useMemo } from "react";
import { Book02Icon } from "@hugeicons/core-free-icons";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { drawingAspect, Elevation } from "../blueprint/Elevation.js";
import { Button, TextButton } from "../primitives/Buttons.js";
import { BracketLabel, MonoLabel } from "../primitives/Label.js";
import { Ruler } from "../primitives/Ruler.js";
import { StatusChip } from "../primitives/StatusChip.js";
import { body, display, mono } from "../primitives/type.js";
import { heroDrawingAttribute } from "./Loader.js";
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
  const aspect = useMemo(() => drawingAspect(world), [world]);
  const drawingTarget = { [heroDrawingAttribute]: "" };
  return (
    <section
      aria-labelledby="hero-title"
      className="flex flex-col border-b border-rule lg:min-h-[calc(100dvh-16px-56px)]"
    >
      <div className="relative flex min-h-[110vw] flex-1 items-center justify-center border-b border-rule lg:min-h-0">
        <Ruler />
        <PointerLines />
        <div
          data-intro="fade"
          className={`${corner} top-[calc(var(--spacing)*3.6)] left-[calc(var(--spacing)*3.6)]`}
        >
          <BracketLabel>Level 01</BracketLabel>
          <MonoLabel className="text-ink">{world.title}</MonoLabel>
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
          className={`[--hero-drawing-max:88%] lg:[--hero-drawing-max:72%] ${drawingVisible ? "visible" : "invisible"}`}
          style={{
            width: `min(var(--hero-drawing-max), calc((100dvh - 330px) * ${aspect.toFixed(4)}))`,
          }}
        >
          <Elevation world={world} />
        </div>
        <p
          className={`${body.s} absolute bottom-[calc(var(--spacing)*3.6)] left-[calc(var(--spacing)*3.6)] max-w-[28ch] text-ink`}
        >
          Find the key. Open the locked door. Reach the goal.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-px bg-rule lg:grid-cols-4">
        <div className="bg-paper p-[12px] lg:p-3 lg:col-span-2">
          <h1 id="hero-title" data-intro="lines" className={display.xl}>
            <span className="block">The AI game studio </span>
            <span className="block">that plays </span>
            <span className="block">what it builds</span>
          </h1>
        </div>
        <div className="flex flex-col justify-between gap-6 bg-paper p-[12px] lg:p-3">
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
        <div className="flex flex-col items-start justify-end gap-4 bg-paper p-[12px] lg:p-3">
          <div data-intro="fade">
            <Button onClick={onOpenStudio}>Open the studio</Button>
          </div>
          <div data-intro="fade">
            <TextButton onClick={onOpenExample}>Open example world</TextButton>
          </div>
        </div>
      </div>
    </section>
  );
}
