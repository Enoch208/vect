import { useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { prefersReducedMotion } from "../motion.js";
import { dashedRuleVertical, mono } from "../primitives/type.js";

const stack = [
  "OpenAI",
  "Three.js",
  "React Three Fiber",
  "React",
  "TypeScript",
  "Zod",
  "GSAP",
  "Lenis",
  "Vite",
  "Vercel",
] as const;

const arrowButton =
  "flex w-[calc(var(--spacing)*4.4)] items-center justify-center border-l border-rule text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

export function BuiltWith() {
  const track = useRef<HTMLUListElement>(null);

  function nudge(direction: 1 | -1) {
    const element = track.current;
    const cell = element?.firstElementChild;
    if (element === null || cell === null || cell === undefined) return;
    element.scrollBy({
      left: direction * cell.getBoundingClientRect().width,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  return (
    <div aria-labelledby="built-with-title" role="region" className="border-t border-rule">
      <div className="flex h-[calc(var(--spacing)*4.4)] items-stretch border-b border-rule">
        <p
          id="built-with-title"
          className={`${mono.label} flex flex-1 items-center px-[12px] lg:px-3 text-ink`}
        >
          Built with
        </p>
        <button
          type="button"
          aria-label="Scroll the list back"
          className={arrowButton}
          onClick={() => {
            nudge(-1);
          }}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} aria-hidden size={14} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="Scroll the list on"
          className={arrowButton}
          onClick={() => {
            nudge(1);
          }}
        >
          <HugeiconsIcon icon={ArrowRight02Icon} aria-hidden size={14} strokeWidth={1.5} />
        </button>
      </div>
      <ul
        ref={track}
        className="flex h-[calc(var(--spacing)*11.5)] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {stack.map((name) => (
          <li
            key={name}
            className="relative flex w-[calc(var(--spacing)*17.1)] shrink-0 snap-start items-center justify-center"
          >
            <span className={`${mono.label} text-ink`}>{name}</span>
            <span
              aria-hidden
              className={`${dashedRuleVertical} absolute top-2 right-0 bottom-2 h-auto`}
            />
          </li>
        ))}
      </ul>
      <p
        className={`${mono.xs} border-t border-rule px-[12px] lg:px-3 py-[calc(var(--spacing)*0.8)] text-muted`}
      >
        Runs in any modern browser. No install, no account.
      </p>
    </div>
  );
}
