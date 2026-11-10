import type { ReactNode } from "react";
import { mono } from "../primitives/type.js";

type ProductFigureProps = { kind: "studio" | "proof"; children: ReactNode };

export function ProductFigure({ kind, children }: ProductFigureProps) {
  const proof = kind === "proof";
  return (
    <figure className="group relative flex aspect-[1.12] w-full flex-col justify-center">
      <div className="absolute inset-x-[8%] top-[7%] opacity-55">{children}</div>
      <div className="relative mt-[12%] border border-ink/60 bg-paper-raised transition-transform duration-700 group-hover:-translate-y-2 motion-reduce:transition-none">
        <div
          className={`${mono.xs} flex items-center justify-between border-b border-rule bg-ink px-3 py-2 text-paper-raised`}
        >
          <span>{proof ? "Proof · Before / After" : "Studio · The Last Observatory"}</span>
          <span aria-hidden>↗</span>
        </div>
        <img
          src={`/landing/${kind}-capture.webp`}
          alt={
            proof
              ? "Recorded Vect repair: failed run, one-key patch and freshly verified result"
              : "Vect's working studio with a playable 3D world and room controls"
          }
          width={1366}
          height={768}
          loading="lazy"
          className="block w-full"
        />
      </div>
      <figcaption className={`${mono.xs} mt-4 flex items-center gap-2 text-muted`}>
        <span aria-hidden className="size-[5px] bg-accent" />
        {proof
          ? "Recorded repair · one key moved · fresh replay"
          : "Actual studio capture · example world"}
      </figcaption>
    </figure>
  );
}
