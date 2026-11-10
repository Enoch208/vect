import type { ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { mono } from "./type.js";

const tones = {
  neutral: "border-ink/40 bg-paper-raised/70 text-ink",
  positive: "border-positive bg-positive/10 text-positive",
  failure: "border-accent bg-accent-soft text-accent",
  caution: "border-caution bg-caution/10 text-caution",
} as const;

type StatusChipProps = {
  tone: keyof typeof tones;
  icon: IconSvgElement;
  children: ReactNode;
  className?: string;
};

export function StatusChip({ tone, icon, children, className = "" }: StatusChipProps) {
  return (
    <span
      className={`${mono.xs} inline-flex items-center gap-[0.5em] border px-[0.7em] py-[0.35em] ${tones[tone]} ${className}`}
    >
      <HugeiconsIcon icon={icon} aria-hidden size="1.15em" strokeWidth={1.6} />
      {children}
    </span>
  );
}
