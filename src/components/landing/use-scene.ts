import { useLayoutEffect, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, registerMotion } from "./motion.js";

export function useReducedMotion(): boolean {
  const [reduced] = useState(prefersReducedMotion);
  return reduced;
}

export function useScene(
  root: RefObject<HTMLElement | null>,
  build: (element: HTMLElement) => void,
): void {
  useLayoutEffect(() => {
    const element = root.current;
    if (element === null || prefersReducedMotion()) return;
    registerMotion();
    const context = gsap.context(() => {
      build(element);
    }, element);
    return () => {
      context.revert();
    };
  }, [root, build]);
}
