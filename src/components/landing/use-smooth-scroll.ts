import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, registerMotion, type MotionOptions } from "./motion.js";

const defaultLagThreshold = 500;
const defaultLagAdjusted = 33;

export function startSmoothScroll({ reducedMotion }: MotionOptions): () => void {
  if (reducedMotion) return () => undefined;
  registerMotion();
  const lenis = new Lenis({ anchors: true });
  lenis.on("scroll", () => {
    ScrollTrigger.update();
  });
  const tick = (seconds: number) => {
    lenis.raf(seconds * 1000);
  };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(defaultLagThreshold, defaultLagAdjusted);
    lenis.destroy();
  };
}

export function useSmoothScroll(): void {
  useEffect(() => startSmoothScroll({ reducedMotion: prefersReducedMotion() }), []);
}
