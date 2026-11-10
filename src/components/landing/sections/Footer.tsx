import { useMemo, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { engineVersion, verifierVersion } from "../../../contract/versions.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { worldRevisionHash } from "../../../domain/canonical.js";
import { VectMark } from "../blueprint/Mark.js";
import { Wordmark } from "../blueprint/Wordmark.js";
import { creditsUrl, navLinks, readmeUrl, repositoryUrl } from "../links.js";
import { MonoLabel } from "../primitives/Label.js";
import { Ruler } from "../primitives/Ruler.js";
import { body, display, mono } from "../primitives/type.js";
import { useScene } from "../use-scene.js";

const stack = ["OpenAI", "Three.js", "React Three Fiber", "TypeScript", "Zod", "Vercel"] as const;

const link = `${body.m} text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:text-[length:calc(var(--spacing)*1.8)]`;
const cell =
  "flex flex-col gap-[calc(var(--spacing)*2.4)] border-rule p-[12px] lg:px-[calc(var(--spacing)*1.6)] lg:py-[calc(var(--spacing)*2.5)]";

function Column({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={`${cell} border-b lg:border-r`}>
      <MonoLabel>{label}</MonoLabel>
      <ul className="flex flex-col gap-[calc(var(--spacing)*1.3)]">{children}</ul>
    </div>
  );
}

function drawWordmark(element: HTMLElement): void {
  const strip = element.querySelector("[data-wordmark]");
  if (strip === null) return;
  gsap.fromTo(
    strip.querySelector("svg"),
    { clipPath: "inset(0 100% 0 0)" },
    {
      clipPath: "inset(0 0% 0 0)",
      ease: "none",
      scrollTrigger: { trigger: strip, start: "top bottom", end: "bottom bottom", scrub: 0.6 },
    },
  );
}

type FooterProps = { world: WorldSpec; onOpenStudio: () => void; onOpenExample: () => void };

export function Footer({ world, onOpenStudio, onOpenExample }: FooterProps) {
  const root = useRef<HTMLElement>(null);
  const revision = useMemo(() => worldRevisionHash(world).slice(0, 12), [world]);
  useScene(root, drawWordmark);
  return (
    <footer ref={root} className="bg-paper">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[25%_repeat(3,calc(50%/3))_25%]">
        <div className={`${cell} border-b sm:col-span-2 lg:col-span-1 lg:border-r`}>
          <p className={`${display.s} max-w-[14ch]`}>
            The AI game studio that plays what it builds
          </p>
        </div>
        <Column label="Product">
          <li>
            <button type="button" onClick={onOpenStudio} className={link}>
              Studio
            </button>
          </li>
          <li>
            <button type="button" onClick={onOpenExample} className={link}>
              Example world
            </button>
          </li>
        </Column>
        <Column label="Project">
          <li>
            <a href={repositoryUrl} className={link}>
              GitHub
            </a>
          </li>
          <li>
            <a href={readmeUrl} className={link}>
              README
            </a>
          </li>
          <li>
            <a href={creditsUrl} className={link}>
              Credits
            </a>
          </li>
        </Column>
        <Column label="On this page">
          {navLinks
            .filter((item) => item.href.startsWith("#"))
            .map((item) => (
              <li key={item.label}>
                <a href={item.href} className={link}>
                  {item.label}
                </a>
              </li>
            ))}
        </Column>
        <div className="flex items-center justify-center border-b border-rule p-[calc(var(--spacing)*6)] max-lg:hidden lg:row-span-2">
          <VectMark weight={1.1} className="size-[calc(var(--spacing)*22)] text-ink" />
        </div>
        <div className="flex flex-col justify-between border-b border-rule lg:border-r">
          <div className={cell}>
            <MonoLabel>Get the code</MonoLabel>
            <p className={`${body.m} text-ink-72`}>The engine, the tests and the example worlds.</p>
          </div>
          <a
            href={repositoryUrl}
            className={`${mono.label} group flex h-[calc(var(--spacing)*4.7)] items-stretch border-t border-rule text-muted transition-colors hover:text-ink`}
          >
            <span className="flex flex-1 items-center px-[12px] normal-case lg:px-[calc(var(--spacing)*1.3)]">
              github.com/Enoch208/vect
            </span>
            <span className="flex w-[calc(var(--spacing)*4.7)] items-center justify-center border-l border-rule">
              <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden size={14} strokeWidth={1.5} />
            </span>
          </a>
        </div>
        <div className={`${cell} border-b lg:border-r`}>
          <MonoLabel>Engine</MonoLabel>
          <p className={`${mono.label} text-ink normal-case`}>{engineVersion}</p>
          <p className={`${mono.label} text-ink normal-case`}>{verifierVersion}</p>
        </div>
        <div className="flex flex-col border-b border-rule lg:border-r">
          <div className={`${cell} border-b`}>
            <MonoLabel>Example world</MonoLabel>
            <p className={`${mono.label} text-ink normal-case`}>{world.id}</p>
          </div>
          <div className={cell}>
            <MonoLabel>Revision</MonoLabel>
            <p className={`${mono.label} text-ink normal-case`}>{revision}</p>
          </div>
        </div>
        <div className={`${cell} border-b lg:border-r`}>
          <MonoLabel>Built with</MonoLabel>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-[calc(var(--spacing)*1.3)]">
            {stack.map((name) => (
              <li
                key={name}
                className={`${body.m} text-ink lg:text-[length:calc(var(--spacing)*1.8)]`}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        data-wordmark=""
        className="relative px-[calc(var(--spacing)*8)] py-[calc(var(--spacing)*6)]"
      >
        <Ruler />
        <Wordmark />
      </div>
      <div className="flex border-t border-rule">
        <p className={`${mono.xs} flex flex-1 items-center px-[12px] py-3 text-ink lg:px-3`}>
          ©2026 Vect
        </p>
        <a
          href={creditsUrl}
          className={`${body.m} flex items-center border-rule border-l px-[calc(var(--spacing)*2)] py-3 text-ink transition-colors hover:text-accent lg:text-[length:calc(var(--spacing)*1.8)]`}
        >
          Credits
        </a>
        <a
          href={repositoryUrl}
          className={`${body.m} flex items-center border-rule border-l px-[calc(var(--spacing)*2)] py-3 text-ink transition-colors hover:text-accent lg:text-[length:calc(var(--spacing)*1.8)]`}
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
