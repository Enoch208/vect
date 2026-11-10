import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { drawEase, prefersReducedMotion, registerMotion, type MotionOptions } from "./motion.js";

export const revealAttribute = "data-reveal";

function revealLines(element: Element): void {
  let played = false;
  SplitText.create(element, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit: (split: SplitText) => {
      if (played) return;
      gsap.from(split.lines, {
        yPercent: 100,
        duration: 0.8,
        ease: drawEase,
        stagger: 0.06,
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
          onEnter: () => {
            played = true;
          },
        },
      });
    },
  });
}

export function startReveal(root: Element | null, { reducedMotion }: MotionOptions): () => void {
  if (reducedMotion) return () => undefined;
  registerMotion();
  const context = gsap.context(() => {
    if (root === null) return;
    root.querySelectorAll(`[${revealAttribute}]`).forEach(revealLines);
  });
  return () => {
    context.revert();
  };
}

export function useReveal(root: RefObject<Element | null>): void {
  useEffect(() => startReveal(root.current, { reducedMotion: prefersReducedMotion() }), [root]);
}
