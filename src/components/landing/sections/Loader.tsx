import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { engineVersion } from "../../../contract/versions.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { drawingAspect, Elevation } from "../blueprint/Elevation.js";
import { loaderPhases } from "../loader-steps.js";
import { prefersReducedMotion, registerMotion } from "../motion.js";
import { Sequence } from "../primitives/Sequence.js";
import { SpecSheet } from "../primitives/SpecSheet.js";
import { display, mono } from "../primitives/type.js";
import { loaderTimeline } from "./loader-timeline.js";

const played = { once: false };

const clock = {
  now: () => performance.now(),
  isoNow: () => new Date().toISOString(),
};

export function shouldPlayLoader(): boolean {
  return typeof window !== "undefined" && !played.once && !prefersReducedMotion();
}

export const heroDrawingAttribute = "data-hero-drawing";

const specRows = [
  { key: "Type", value: "AI game studio" },
  { key: "Engine", value: engineVersion },
  { key: "Focus", value: "Playable, verified 3D worlds" },
  { key: "Runs in", value: "Your browser" },
];

type LoaderProps = { world: WorldSpec; onReveal: () => void; onDone: () => void };

export function Loader({ world, onReveal, onDone }: LoaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const finish = useRef(onDone);
  const reveal = useRef(onReveal);
  const phases = useMemo(() => loaderPhases(world, clock), [world]);
  const aspect = useMemo(() => drawingAspect(world), [world]);
  const [values, setValues] = useState<readonly string[]>([]);

  useEffect(() => {
    finish.current = onDone;
    reveal.current = onReveal;
  }, [onDone, onReveal]);

  useEffect(() => {
    const element = root.current;
    if (element === null) return;
    registerMotion();
    window.scrollTo(0, 0);
    let context: gsap.Context | null = null;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      context = gsap.context((self) => {
        loaderTimeline(
          element,
          phases,
          {
            onStep: (index, value) => {
              setValues((previous) => [...previous.slice(0, index), value]);
            },
            onReveal: () => {
              reveal.current();
            },
            onDone: () => {
              played.once = true;
              finish.current();
            },
            heroTarget: () => document.querySelector(`[${heroDrawingAttribute}]`),
          },
          self,
        );
      }, element);
    });
    return () => {
      cancelled = true;
      context?.revert();
    };
  }, [phases]);

  const items = phases.map((phase, index) => {
    const value = values[index];
    return {
      index: index + 1,
      label: value === undefined ? phase.label : `${phase.label} · ${value}`,
      done: value !== undefined,
    };
  });

  return (
    <div
      ref={root}
      role="status"
      aria-label={`Checking the example world ${world.id}`}
      className="fixed inset-0 z-[35]"
    >
      <div data-loader-backdrop="" className="absolute inset-0 bg-paper" />
      <div className="absolute inset-x-0 top-[12%] bottom-[22%] flex items-end justify-center">
        <div
          data-loader-drawing=""
          aria-hidden
          style={{ width: `min(84vw, calc(66vh * ${aspect.toFixed(4)}))` }}
        >
          <Elevation world={world} architectural showLabels={false} />
        </div>
      </div>
      <div data-loader-chrome="">
        <div
          data-scan=""
          className="absolute inset-x-[8px] top-1/2 h-px origin-left scale-x-0 bg-accent"
        />
        <p
          data-percent=""
          className={`${mono.xs} absolute top-[calc(50%-var(--spacing)*1.9)] left-[calc(8px+var(--spacing)*3)] text-accent`}
        >
          0%
        </p>
        <div className="absolute inset-x-[8px] bottom-[8px] flex flex-col gap-4 px-[12px] lg:px-3 pb-[calc(var(--spacing)*2.4)] lg:flex-row lg:items-end">
          <p data-statement="" className={`${display.s} text-ink`}>
            <span className="block">Built to prove</span>
            <span className="block">every world</span>
            <span className="block">it makes</span>
          </p>
          <SpecSheet
            title="Welcome to Vect"
            rows={specRows}
            className="absolute bottom-[calc(var(--spacing)*2.4)] left-[67.2%] max-lg:hidden"
          />
          <Sequence
            items={items}
            pending="hidden"
            className="lg:absolute lg:bottom-[calc(var(--spacing)*2.4)] lg:left-[87.4%]"
          />
        </div>
      </div>
    </div>
  );
}
