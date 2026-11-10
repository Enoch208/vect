import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

export type MotionOptions = { reducedMotion: boolean };

export const drawEase = "vect-draw";

let registered = false;

export function registerMotion(): void {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create(drawEase, "0.4,0,0,1");
  registered = true;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
