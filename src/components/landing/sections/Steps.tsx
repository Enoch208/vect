import { useCallback, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { MonoLabel } from "../primitives/Label.js";
import { Crosshair } from "../primitives/Ruler.js";
import { body, display } from "../primitives/type.js";
import { useReducedMotion, useScene } from "../use-scene.js";
import { stepsFor, type Step } from "./step-content.js";

function StepBar({ step, active }: { step: Step; active: boolean }) {
  return (
    <div
      className={`flex min-h-[calc(var(--spacing)*5.8)] flex-col items-start gap-2 bg-ink px-[12px] py-[calc(var(--spacing)*1.6)] text-paper-raised lg:flex-row lg:items-center lg:gap-6 lg:py-0 transition-opacity duration-500 lg:px-3 ${active ? "opacity-100" : "opacity-0"}`}
    >
      <span className={`${display.s} shrink-0 lg:w-[calc(var(--spacing)*18)]`}>{step.name}</span>
      <span className={`${body.m} flex-1 text-paper-raised/85`}>{step.caption}</span>
      <span aria-hidden className="size-[7px] shrink-0 bg-accent max-lg:hidden" />
    </div>
  );
}

function Pinned({ steps }: { steps: readonly Step[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const build = useCallback(
    (element: HTMLElement) => {
      const media = gsap.matchMedia();
      media.add("(min-width: 1024px)", () => {
        ScrollTrigger.create({
          trigger: element,
          start: "top top",
          end: `+=${String(steps.length * 70)}%`,
          pin: true,
          onUpdate: (self) => {
            setIndex(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)));
          },
        });
      });
    },
    [steps.length],
  );
  useScene(root, build);
  const slide =
    "transition-transform duration-700 ease-[cubic-bezier(.4,0,0,1)] motion-reduce:transition-none";
  return (
    <div ref={root} className="relative hidden h-[calc(100dvh-16px)] grid-cols-2 bg-paper lg:grid">
      <div className="relative overflow-hidden border-r border-rule">
        <Crosshair className="top-[calc(var(--spacing)*1.4)] left-[calc(var(--spacing)*16)] -translate-1/2" />
        <Crosshair className="top-[calc(var(--spacing)*1.4)] right-[calc(var(--spacing)*16)] translate-x-1/2 -translate-y-1/2" />
        <div
          className={`absolute inset-0 ${slide}`}
          style={{ transform: `translateY(${String(-index * 100)}%)` }}
        >
          {steps.map((step, position) => (
            <div
              key={step.name}
              aria-hidden={position !== index}
              className="absolute inset-x-0 flex h-full items-center justify-center px-[calc(var(--spacing)*8)]"
              style={{ top: `${String(position * 100)}%` }}
            >
              <div className="w-full">{step.drawing}</div>
            </div>
          ))}
        </div>
        <span aria-hidden className="absolute top-1/2 right-0 left-3 h-px bg-accent" />
      </div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2">
          <div className="relative">
            {steps.map((step, position) => (
              <div key={step.name} className={position === 0 ? "" : "absolute inset-0"}>
                <StepBar step={step} active={position === index} />
              </div>
            ))}
          </div>
        </div>
        <div
          className={`absolute inset-0 ${slide}`}
          style={{ transform: `translateY(${String(-index * 100)}%)` }}
        >
          {steps.map((step, position) => (
            <div
              key={step.name}
              aria-hidden={position !== index}
              className="absolute inset-x-0 flex h-full items-end justify-center px-[calc(var(--spacing)*8)] pb-[calc(var(--spacing)*10)]"
              style={{ top: `${String(position * 100)}%` }}
            >
              {step.detail}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stacked({ steps, className = "" }: { steps: readonly Step[]; className?: string }) {
  return (
    <ol className={className}>
      {steps.map((step) => (
        <li key={step.name} className="border-t border-rule">
          <StepBar step={step} active />
          <div className="grid gap-6 p-[12px] lg:grid-cols-2 lg:p-3">
            <div>{step.drawing}</div>
            <div className="flex items-end">{step.detail}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

type StepsProps = { world: WorldSpec; twin: WorldSpec };

export function Steps({ world, twin }: StepsProps) {
  const steps = useMemo(() => stepsFor(world, twin), [world, twin]);
  const reduced = useReducedMotion();
  return (
    <section aria-labelledby="steps-title" className="border-b border-rule">
      <div className="flex min-h-[calc(var(--spacing)*19.8)] flex-col justify-end gap-[calc(var(--spacing)*1.6)] border-b border-rule p-[12px] lg:p-3">
        <MonoLabel>Why Vect</MonoLabel>
        <h2 id="steps-title" data-reveal="" className={display.l}>
          Built like a QA team
        </h2>
      </div>
      {reduced ? <Stacked steps={steps} /> : <Pinned steps={steps} />}
      {!reduced && <Stacked steps={steps} className="lg:hidden" />}
    </section>
  );
}
