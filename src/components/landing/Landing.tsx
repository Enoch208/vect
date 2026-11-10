import { useRef } from "react";
import "lenis/dist/lenis.css";
import { Frame } from "./primitives/Frame.js";
import { Grain } from "./primitives/Grain.js";
import { fluidUnit } from "./primitives/type.js";
import { Header } from "./sections/Header.js";
import { useReveal } from "./use-reveal.js";
import { useSmoothScroll } from "./use-smooth-scroll.js";

export type LandingProps = {
  onOpenStudio: () => void;
  onOpenExample: () => void;
  onPrompt: (prompt: string) => void;
};

export function Landing(props: LandingProps) {
  const root = useRef<HTMLDivElement>(null);
  useSmoothScroll();
  useReveal(root);
  return (
    <div ref={root} className={`${fluidUnit} relative min-h-dvh bg-paper px-[8px] text-ink`}>
      <Frame />
      <Grain />
      <div className="pt-[8px]">
        <Header onOpenStudio={props.onOpenStudio} />
      </div>
    </div>
  );
}
