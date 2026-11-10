import type { ReactNode } from "react";
import { mono } from "../primitives/type.js";

export function ProcessFigure({ drawing, name }: { drawing: ReactNode; name: string }) {
  return (
    <figure className="relative flex min-w-0 w-full flex-col gap-6">
      <figcaption
        className={`${mono.xs} flex justify-between border-b border-dashed border-rule pb-3 text-muted`}
      >
        <span>{name} · The Last Observatory</span>
        <span>Engine view</span>
      </figcaption>
      <img
        src="/landing/observatory-three-quarter.png"
        alt="The playable observatory rendered by Vect's 3D engine"
        width={1366}
        height={768}
        loading="lazy"
        className="w-full border border-rule"
      />
      <div className="relative -mt-[12%] ml-[10%] w-[90%] border border-rule bg-paper p-5">
        {drawing}
      </div>
    </figure>
  );
}

const captures: Record<string, { src: string; label: string }> = {
  Generate: { src: "studio", label: "World ready to play" },
  Play: { src: "play", label: "Player reaches the goal" },
  Test: { src: "test", label: "A real run finds the blocked door" },
  Repair: { src: "proof", label: "Before, patch and verified replay" },
};

export function ProcessDetail({ name, children }: { name: string; children: ReactNode }) {
  const capture = captures[name];
  return (
    <div className="flex min-w-0 w-full flex-col gap-6">
      {capture && (
        <figure className="border border-rule bg-paper-raised">
          <figcaption
            className={`${mono.xs} border-b border-rule bg-ink px-3 py-2 text-paper-raised`}
          >
            {capture.label}
          </figcaption>
          <img
            src={`/landing/${capture.src}-capture.webp`}
            alt={`Actual Vect ${name.toLowerCase()} session`}
            width={1366}
            height={768}
            loading="lazy"
            className="block w-full"
          />
        </figure>
      )}
      <div className="border-t border-dashed border-rule pt-4 [&>div]:w-full [&>div]:text-[11px] [&_dt]:w-[96px] [&>ol]:text-[10px] [&_li]:whitespace-normal [&_li]:leading-relaxed">
        {children}
      </div>
    </div>
  );
}
