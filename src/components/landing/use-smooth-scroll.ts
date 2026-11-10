import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, registerMotion, type MotionOptions } from "./motion.js";

const defaultLagThreshold = 500;
const defaultLagAdjusted = 33;

export type SmoothScroll = {
  stop: () => void;
  setLocked: (locked: boolean) => void;
};

const staticScroll: SmoothScroll = { stop: () => undefined, setLocked: () => undefined };

export function startSmoothScroll({ reducedMotion }: MotionOptions): SmoothScroll {
  if (reducedMotion) return staticScroll;
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
  return {
    stop: () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(defaultLagThreshold, defaultLagAdjusted);
      lenis.destroy();
    },
    setLocked: (locked) => {
      if (locked) lenis.stop();
      else lenis.start();
    },
  };
}

export function useSmoothScroll(locked: boolean): void {
  const scroll = useRef<SmoothScroll>(staticScroll);
  useEffect(() => {
    const started = startSmoothScroll({ reducedMotion: prefersReducedMotion() });
    scroll.current = started;
    return () => {
      started.stop();
      scroll.current = staticScroll;
    };
  }, []);
  useEffect(() => {
    scroll.current.setLocked(locked);
  }, [locked]);
}
