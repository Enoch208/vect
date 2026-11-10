import { useRef } from "react";
import { gsap } from "gsap";
import { aiArtwork } from "../landing-assets.js";
import { AiImage } from "../primitives/AiImage.js";
import { useScene } from "../use-scene.js";

const artwork = [aiArtwork.poster, aiArtwork.study, aiArtwork.pavilion] as const;

const scenes = [0, 1, 2, 1, 2, 0, 1, 2] as const;

function zoomArtwork(element: HTMLElement): void {
  gsap.fromTo(
    element.querySelectorAll("[data-case-zoom]"),
    { scale: 1 },
    {
      scale: 1.1,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      },
    },
  );
}

export function UseCaseArtwork({ shown }: { shown: number }) {
  const root = useRef<HTMLDivElement>(null);
  useScene(root, zoomArtwork);
  return (
    <div ref={root} className="pointer-events-none absolute inset-0 overflow-hidden">
      {scenes.map((scene, index) => {
        const picture = artwork[scene];
        const active = index === shown;
        return (
          <div
            key={index}
            data-case-art={index}
            aria-hidden={!active}
            className={`absolute inset-0 bg-paper transition-[opacity,scale] duration-400 ease-[cubic-bezier(.25,.1,.25,1)] motion-reduce:scale-100 motion-reduce:transition-none ${active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
          >
            <AiImage
              art={picture}
              caption="Concept study"
              dataAttribute="data-case-zoom"
              imageClassName="absolute inset-0 h-full w-full object-cover"
              labelClassName="absolute top-3 left-3 bg-paper/90 px-2 py-1 text-ink"
            />
          </div>
        );
      })}
    </div>
  );
}
