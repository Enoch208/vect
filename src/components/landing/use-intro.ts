import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { drawEase, prefersReducedMotion, registerMotion } from "./motion.js";

export const introAttribute = "data-intro";

function playIntro(root: Element): void {
  const lines = SplitText.create(root.querySelectorAll(`[${introAttribute}="lines"]`), {
    type: "lines",
    mask: "lines",
  });
  const timeline = gsap.timeline({ delay: 0.15 });
  timeline.from(lines.lines, { yPercent: 100, duration: 0.8, ease: drawEase, stagger: 0.06 });
  timeline.from(
    root.querySelectorAll(`[${introAttribute}="fade"]`),
    { opacity: 0, y: 8, duration: 0.6, ease: drawEase, stagger: 0.05 },
    0.2,
  );
  timeline.from(
    root.querySelectorAll(`[${introAttribute}="drop"]`),
    { yPercent: -100, duration: 0.8, ease: drawEase },
    0,
  );
}

export function useIntro(root: RefObject<Element | null>, active: boolean): void {
  useLayoutEffect(() => {
    const element = root.current;
    if (!active || element === null || prefersReducedMotion()) return;
    registerMotion();
    const context = gsap.context(() => {
      playIntro(element);
    }, element);
    return () => {
      context.revert();
    };
  }, [root, active]);
}
