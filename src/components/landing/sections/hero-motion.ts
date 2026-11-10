import { gsap } from "gsap";

export function flattenElevation(element: HTMLElement): void {
  const media = gsap.matchMedia();
  media.add("(min-width: 1024px)", () => {
    animateElevation(element, true);
  });
  media.add("(max-width: 1023px)", () => {
    animateElevation(element, false);
  });
}

function animateElevation(element: HTMLElement, desktop: boolean): void {
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: element,
      start: "top 8px",
      end: desktop ? "+=55%" : "bottom top",
      pin: desktop,
      scrub: 0.65,
      invalidateOnRefresh: true,
    },
  });
  timeline.to(
    element.querySelectorAll("[data-elevation-guides]"),
    {
      opacity: 1,
      duration: 0.65,
      ease: "none",
    },
    0.15,
  );
}
