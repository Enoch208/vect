import { useRef } from "react";
import { gsap } from "gsap";
import { useScene } from "../use-scene.js";

const artwork = [
  {
    src: "/landing/observatory-poster.webp",
    alt: "Observatory concept artwork with a vermilion sun",
    width: 1086,
    height: 1448,
  },
  {
    src: "/landing/observatory-study.webp",
    alt: "Perspective concept study of an observatory and its connecting rooms",
    width: 1448,
    height: 1086,
  },
  {
    src: "/landing/portal-pavilion.webp",
    alt: "Portal pavilion concept study with a domed tower and entrance stairs",
    width: 1254,
    height: 1254,
  },
] as const;

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
            <img
              data-case-zoom=""
              src={picture.src}
              alt={picture.alt}
              loading="lazy"
              decoding="async"
              width={picture.width}
              height={picture.height}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
