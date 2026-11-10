import { useRef } from "react";
import { gsap } from "gsap";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { Button } from "../primitives/Buttons.js";
import { display, mono } from "../primitives/type.js";
import { useScene } from "../use-scene.js";
import { BuiltWith } from "./BuiltWith.js";

type StatementProps = { world: WorldSpec; onOpenExample: () => void };

function settlePicture(element: HTMLElement): void {
  const picture = element.querySelector("[data-settle]");
  if (picture === null) return;
  gsap.fromTo(
    picture,
    { clipPath: "inset(14% 16% 14% 16%)", scale: 1.08 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      scale: 1,
      ease: "none",
      scrollTrigger: { trigger: element, start: "top 80%", end: "top 30%", scrub: 0.6 },
    },
  );
}

export function Statement({ world, onOpenExample }: StatementProps) {
  const root = useRef<HTMLElement>(null);
  useScene(root, settlePicture);
  return (
    <section
      ref={root}
      aria-labelledby="statement-title"
      className="grid grid-cols-1 border-b border-rule lg:grid-cols-2"
    >
      <div className="relative min-h-[78vw] overflow-hidden border-rule max-lg:border-b lg:min-h-[calc(var(--spacing)*76.8)] lg:border-r">
        <img
          data-settle=""
          src="/landing/observatory-study.webp"
          loading="lazy"
          width={1448}
          height={1086}
          alt={`Architectural concept study for ${world.title}`}
          className="absolute inset-0 h-full w-full origin-center object-cover object-center"
        />
        <span className={`${mono.xs} absolute bottom-3 left-3 bg-paper/90 px-2 py-1`}>
          The Last Observatory · Concept study
        </span>
      </div>
      <div className="flex flex-col">
        <div className="flex flex-col gap-[calc(var(--spacing)*3.2)] p-[12px] pt-[calc(var(--spacing)*4)] lg:p-3 lg:pt-[calc(var(--spacing)*6)] lg:pl-[calc(var(--spacing)*15.2)]">
          <h2 id="statement-title" data-reveal="" className={`${display.m} max-w-[18ch]`}>
            The part AI skips is the game. A scene that renders is not a level that works.
          </h2>
          <div>
            <Button variant="outline" onClick={onOpenExample}>
              Open example world
            </Button>
          </div>
        </div>
        <div className="flex-1" />
        <BuiltWith />
      </div>
    </section>
  );
}
