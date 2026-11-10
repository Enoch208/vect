import { useEffect, useRef } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { Button } from "../primitives/Buttons.js";
import { aiArtwork } from "../landing-assets.js";
import { AiImage } from "../primitives/AiImage.js";
import { PromptField } from "../primitives/PromptField.js";
import { dashedRule, dashedRuleVertical, display, mono } from "../primitives/type.js";

type CtaProps = { world: WorldSpec; onOpenStudio: () => void; onPrompt: (prompt: string) => void };

function useScrollReadout() {
  const readout = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max <= 0 ? 0 : window.scrollY / max;
      if (readout.current !== null) readout.current.textContent = `[${value.toFixed(3)}]`;
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return readout;
}

export function Cta({ world, onOpenStudio, onPrompt }: CtaProps) {
  const readout = useScrollReadout();
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden border-b border-rule">
      <span
        aria-hidden
        className={`${dashedRuleVertical} absolute inset-y-0 left-1/4 max-lg:hidden`}
      />
      <span
        aria-hidden
        className={`${dashedRuleVertical} absolute inset-y-0 left-3/4 max-lg:hidden`}
      />
      <div className="relative flex h-[calc(var(--spacing)*8)] items-end px-[6px] pb-[calc(var(--spacing)*0.8)]">
        <span ref={readout} aria-hidden className={`${mono.xs} text-ink`}>
          [0.000]
        </span>
      </div>
      <div aria-hidden className={dashedRule} />
      <div className="relative mx-auto flex flex-col items-center gap-[calc(var(--spacing)*3)] px-[12px] pt-[calc(var(--spacing)*6)] lg:w-[62%]">
        <h2 id="cta-title" data-reveal="" className={`${display.l} max-w-[18ch] text-center`}>
          See what Vect builds from your idea
        </h2>
        <Button onClick={onOpenStudio}>Open the studio</Button>
        <PromptField onPrompt={onPrompt} className="w-full max-w-[calc(var(--spacing)*52)]" />
        <AiImage
          art={aiArtwork.pavilion}
          caption={`Portal pavilion · Concept study for ${world.title}`}
          className="w-full max-w-[calc(var(--spacing)*66)]"
          imageClassName="block w-full"
          labelClassName="justify-center pb-3 text-center text-ink"
        />
      </div>
    </section>
  );
}
