import { useMemo, useRef } from "react";
import { gsap } from "gsap";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { LiveBoundary } from "../primitives/LiveBoundary.js";
import { Ruler } from "../primitives/Ruler.js";
import { display, mono } from "../primitives/type.js";
import { useScene } from "../use-scene.js";
import { roomEvents } from "./room-events.js";
import { RoomFragment } from "./RoomFragment.js";

const slots = [
  "lg:top-[calc(var(--spacing)*6)] lg:left-[calc(var(--spacing)*6)]",
  "lg:top-[calc(var(--spacing)*6)] lg:right-[calc(var(--spacing)*6)]",
  "lg:bottom-[calc(var(--spacing)*6)] lg:left-[calc(var(--spacing)*6)]",
  "lg:bottom-[calc(var(--spacing)*6)] lg:right-[calc(var(--spacing)*6)]",
] as const;

const arrivals = [
  { xPercent: -60, yPercent: -40 },
  { xPercent: 60, yPercent: -40 },
  { xPercent: -60, yPercent: 40 },
  { xPercent: 60, yPercent: 40 },
] as const;

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildScene(element: HTMLElement): void {
  if (!window.matchMedia("(min-width: 1024px)").matches) return;
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: element, start: "top top", end: "+=150%", pin: true, scrub: 0.6 },
  });
  timeline.fromTo(
    element.querySelector("[data-scene-title]"),
    { color: token("--color-faint") },
    { color: token("--color-ink"), duration: 0.3, ease: "none" },
  );
  element.querySelectorAll("[data-scene-card]").forEach((card, index) => {
    const from = arrivals[index % arrivals.length] ?? arrivals[0];
    timeline.from(
      card,
      { ...from, opacity: 0, duration: 0.45, ease: "power2.out" },
      0.18 + index * 0.08,
    );
  });
  timeline.from(
    element.querySelector("[data-scene-subtitle]"),
    { opacity: 0, duration: 0.2 },
    0.55,
  );
  timeline.to({}, { duration: 0.35 });
}

function Fragments({ world }: { world: WorldSpec }) {
  const events = useMemo(() => roomEvents(world), [world]);
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:contents">
      {events.map((event, index) => (
        <li
          key={event.code}
          data-scene-card=""
          className={`lg:absolute lg:z-10 lg:w-[calc(var(--spacing)*30)] ${slots[index % slots.length] ?? ""}`}
        >
          <RoomFragment world={world} event={event} />
        </li>
      ))}
    </ul>
  );
}

export function EveryRoom({ world }: { world: WorldSpec }) {
  const root = useRef<HTMLElement>(null);
  useScene(root, buildScene);
  return (
    <section
      ref={root}
      aria-labelledby="every-room-title"
      className="relative flex flex-col gap-8 overflow-hidden border-b border-rule bg-paper px-[12px] py-[calc(var(--spacing)*8)] lg:h-[calc(100dvh-16px)] lg:px-3 lg:py-0"
    >
      <Ruler />
      <div className="flex flex-col items-center gap-[calc(var(--spacing)*1.6)] text-center lg:absolute lg:inset-0 lg:justify-center">
        <h2 id="every-room-title" data-scene-title="" className={display.l}>
          In every room
        </h2>
        <p data-scene-subtitle="" className={`${mono.label} text-muted`}>
          Real events from the engine, the same rules for player and agent
        </p>
      </div>
      <LiveBoundary fallback={null}>
        <Fragments world={world} />
      </LiveBoundary>
    </section>
  );
}
