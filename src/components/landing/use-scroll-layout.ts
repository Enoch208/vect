import { useEffect, type RefObject } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, registerMotion } from "./motion.js";

export function useScrollLayout(root: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = root.current;
    if (element === null || prefersReducedMotion()) return;
    registerMotion();
    let frame = 0;
    let active = true;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    };
    const expanded = (event: TransitionEvent) => {
      if (event.propertyName === "grid-template-rows") refresh();
    };
    element.addEventListener("load", refresh, true);
    element.addEventListener("transitionend", expanded);
    void document.fonts.ready.then(() => {
      if (active) refresh();
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      element.removeEventListener("load", refresh, true);
      element.removeEventListener("transitionend", expanded);
    };
  }, [root]);
}
