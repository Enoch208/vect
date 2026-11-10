import { useEffect, useMemo, useRef } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { Elevation } from "../blueprint/Elevation.js";
import { sectionDrawing } from "../blueprint/section-geometry.js";
import { Button } from "../primitives/Buttons.js";
import { PromptField } from "../primitives/PromptField.js";
import { dashedRule, dashedRuleVertical, display, mono } from "../primitives/type.js";

type CtaProps = { world: WorldSpec; onOpenStudio: () => void; onPrompt: (prompt: string) => void };

function useScrollReadout() {
  const readout = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max <= 0 ? 0 : window.scrollY / max;
      if (readout.current !== null) readout.current.textContent = `[${value.toFixed(3)}]`;
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return readout;
}

function domeView(world: WorldSpec) {
  const drawing = sectionDrawing(world);
  const tallest = drawing.rooms.reduce(
    (best, room) => (room.top < best.top ? room : best),
    drawing.rooms[0] ?? { id: "", left: 0, right: drawing.width, top: 0, floor: drawing.height },
  );
  const width = tallest.right - tallest.left;
  return {
    view: {
      x: tallest.left - width * 1.6,
      y: tallest.top - width * 0.75,
      width: width * 4.2,
      height: tallest.floor - tallest.top + width * 0.75 + 70,
    },
    disc: { cx: tallest.right + width * 0.05, cy: tallest.top - width * 0.42, r: width * 0.2 },
  };
}

export function Cta({ world, onOpenStudio, onPrompt }: CtaProps) {
  const readout = useScrollReadout();
  const { view, disc } = useMemo(() => domeView(world), [world]);
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden border-b border-rule">
      <span
        aria-hidden
        className={`${dashedRuleVertical} absolute inset-y-0 left-1/4 max-lg:hidden`}
      />
      <span
        aria-hidden
        className={`${dashedRuleVertical} absolute inset-y-0 left-3/4 max-lg:hidden`}
      />
      <div className="relative flex h-[calc(var(--spacing)*8)] items-end px-[6px] pb-[calc(var(--spacing)*0.8)]">
        <span ref={readout} aria-hidden className={`${mono.xs} text-ink`}>
          [0.000]
        </span>
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <Button onClick={onOpenStudio}>Open the studio</Button>
        </div>
      </div>
      <div aria-hidden className={dashedRule} />
      <div className="relative mx-auto flex flex-col items-center gap-[calc(var(--spacing)*4)] px-[12px] pt-[calc(var(--spacing)*3)] pb-[calc(var(--spacing)*8)] lg:w-1/2">
        <div className="w-full">
          <Elevation
            world={world}
            view={view}
            showLabels={false}
            underlay={<circle cx={disc.cx} cy={disc.cy} r={disc.r} className="fill-accent" />}
          />
        </div>
        <h2 id="cta-title" data-reveal="" className={`${display.l} max-w-[16ch] text-center`}>
          See what Vect builds from your idea
        </h2>
        <PromptField onPrompt={onPrompt} className="w-full max-w-[calc(var(--spacing)*52)]" />
      </div>
    </section>
  );
}
