import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import type { LoaderPhase } from "../loader-steps.js";

export type LoaderHooks = {
  onStep: (index: number, value: string) => void;
  onReveal: () => void;
  onDone: () => void;
  heroTarget: () => Element | null;
};

const phaseSeconds = 0.46;

function startOf(element: Element): number {
  return Number(element.getAttribute("data-start") ?? "0");
}

function drawingTimeline(root: HTMLElement): gsap.core.Timeline {
  const draw = gsap.timeline({ paused: true });
  root.querySelectorAll("[data-loader-drawing] [data-draw]").forEach((path) => {
    draw.fromTo(
      path,
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: 0.3, ease: "none" },
      startOf(path),
    );
  });
  root.querySelectorAll("[data-loader-drawing] [data-label]").forEach((label) => {
    draw.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, startOf(label));
  });
  return draw;
}

function exit(root: HTMLElement, hooks: LoaderHooks): gsap.core.Timeline {
  const drawing = root.querySelector("[data-loader-drawing]");
  const target = hooks.heroTarget();
  hooks.onReveal();
  gsap.set(root.querySelectorAll("[data-loader-drawing] [data-draw]"), {
    clearProps: "strokeDasharray,strokeDashoffset",
  });
  const leave = gsap.timeline({ onComplete: hooks.onDone });
  leave.to(
    root.querySelectorAll("[data-loader-chrome]"),
    {
      opacity: 0,
      duration: 0.35,
      ease: "none",
    },
    0,
  );
  if (drawing !== null && target !== null) {
    const from = drawing.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    leave.to(
      drawing,
      {
        x: to.left - from.left,
        y: to.top - from.top,
        scale: to.width / from.width,
        transformOrigin: "0 0",
        duration: 1.1,
        ease: "expo.out",
      },
      0.1,
    );
  }
  leave.to(
    root.querySelector("[data-loader-backdrop]"),
    { opacity: 0, duration: 0.9, ease: "expo.out" },
    0.3,
  );
  return leave;
}

export function loaderTimeline(
  root: HTMLElement,
  phases: readonly LoaderPhase[],
  hooks: LoaderHooks,
  context: gsap.Context,
) {
  const draw = drawingTimeline(root);
  const scan = root.querySelector("[data-scan]");
  const percent = root.querySelector("[data-percent]");
  const counter = { value: 0 };
  const statement = SplitText.create(root.querySelectorAll("[data-statement]"), {
    type: "lines",
    mask: "lines",
  });
  const timeline = gsap.timeline({ delay: 0.35 });
  timeline.from(statement.lines, { yPercent: 100, duration: 0.9, ease: "expo.out", stagger: 0.05 });
  timeline.from(
    root.querySelectorAll("[data-spec-line]"),
    { opacity: 0, duration: 0.01, stagger: 0.07 },
    0.15,
  );
  phases.forEach((phase, index) => {
    const progress = (index + 1) / phases.length;
    timeline.call(() => {
      hooks.onStep(index, phase.run());
    });
    timeline.to(draw, { progress, duration: phaseSeconds, ease: "none" }, "<");
    timeline.to(scan, { scaleX: progress, duration: phaseSeconds, ease: "none" }, "<");
    timeline.to(
      counter,
      {
        value: progress * 100,
        duration: phaseSeconds,
        ease: "none",
        onUpdate: () => {
          if (percent !== null) percent.textContent = `${String(Math.round(counter.value))}%`;
        },
      },
      "<",
    );
  });
  timeline.call(
    () => {
      context.add(() => exit(root, hooks));
    },
    undefined,
    "+=0.45",
  );
  return timeline;
}
