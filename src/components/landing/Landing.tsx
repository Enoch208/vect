import { useCallback, useRef, useState } from "react";
import "lenis/dist/lenis.css";
import { observatory, observatoryKeyBehindDoor } from "../../fixtures/observatory.js";
import { Frame } from "./primitives/Frame.js";
import { Grain } from "./primitives/Grain.js";
import { fluidUnit } from "./primitives/type.js";
import { EveryRoom } from "./sections/EveryRoom.js";
import { FaultPlan } from "./sections/FaultPlan.js";
import { Header } from "./sections/Header.js";
import { Hero } from "./sections/Hero.js";
import { Loader, shouldPlayLoader } from "./sections/Loader.js";
import { Statement } from "./sections/Statement.js";
import { Walkthrough } from "./sections/Walkthrough.js";
import { useIntro } from "./use-intro.js";
import { useReveal } from "./use-reveal.js";
import { useSmoothScroll } from "./use-smooth-scroll.js";

export type LandingProps = {
  onOpenStudio: () => void;
  onOpenExample: () => void;
  onPrompt: (prompt: string) => void;
};

type Phase = "loading" | "revealing" | "ready";

export function Landing(props: LandingProps) {
  const root = useRef<HTMLDivElement>(null);
  const [withLoader] = useState(shouldPlayLoader);
  const [phase, setPhase] = useState<Phase>(withLoader ? "loading" : "revealing");
  const reveal = useCallback(() => {
    setPhase("revealing");
  }, []);
  const finish = useCallback(() => {
    setPhase("ready");
  }, []);
  useSmoothScroll(phase === "loading");
  useReveal(root);
  useIntro(root, phase !== "loading");
  return (
    <div ref={root} className={`${fluidUnit} relative min-h-dvh bg-paper px-[8px] text-ink`}>
      <Frame />
      <Grain />
      {withLoader && phase !== "ready" && (
        <Loader world={observatory} onReveal={reveal} onDone={finish} />
      )}
      <div className="pt-[8px]">
        <Header onOpenStudio={props.onOpenStudio} />
        <main>
          <Hero
            world={observatory}
            drawingVisible={!withLoader || phase === "ready"}
            onOpenStudio={props.onOpenStudio}
            onOpenExample={props.onOpenExample}
          />
          <FaultPlan world={observatoryKeyBehindDoor} />
          <Statement world={observatory} onOpenExample={props.onOpenExample} />
          <EveryRoom world={observatory} />
          <Walkthrough world={observatory} twin={observatoryKeyBehindDoor} />
        </main>
      </div>
    </div>
  );
}
