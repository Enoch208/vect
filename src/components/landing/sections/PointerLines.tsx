import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, registerMotion } from "../motion.js";

export function PointerLines() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    const stage = element?.parentElement;
    const horizontal = element?.querySelector("[data-axis='x']");
    const vertical = element?.querySelector("[data-axis='y']");
    if (
      element === null ||
      stage === null ||
      stage === undefined ||
      horizontal === null ||
      horizontal === undefined ||
      vertical === null ||
      vertical === undefined ||
      prefersReducedMotion() ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }
    registerMotion();
    const moveY = gsap.quickTo(horizontal, "y", { duration: 0.55, ease: "expo.out" });
    const moveX = gsap.quickTo(vertical, "x", { duration: 0.55, ease: "expo.out" });
    const fade = gsap.quickTo(element, "opacity", { duration: 0.35, ease: "power2.out" });
    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      moveX(event.clientX - rect.left);
      moveY(event.clientY - rect.top);
      fade(1);
    };
    const onLeave = () => {
      fade(0);
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([element, horizontal, vertical]);
    };
  }, []);
  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden opacity-0"
    >
      <span data-axis="x" className="absolute top-0 right-0 left-0 h-px bg-ink/40" />
      <span data-axis="y" className="absolute top-0 bottom-0 left-0 w-px bg-ink/40" />
    </div>
  );
}
