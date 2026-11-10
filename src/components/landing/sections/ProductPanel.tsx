import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AiMagicIcon,
  ReplayIcon,
  UserMultipleIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { body, display, mono } from "../primitives/type.js";

const features: ReadonlyArray<{ text: string; icon: IconSvgElement }> = [
  { text: "Live generation", icon: AiMagicIcon },
  { text: "Same rules for player and agent", icon: UserMultipleIcon },
  { text: "Independent replay", icon: ReplayIcon },
  { text: "Bounded repair", icon: Wrench01Icon },
];

type ProductPanelProps = { titleId: string; className?: string };

export function ProductPanel({ titleId, className = "" }: ProductPanelProps) {
  return (
    <aside aria-labelledby={titleId} className={`flex flex-col bg-paper ${className}`}>
      <p
        className={`${mono.label} border-b border-rule px-[12px] py-[calc(var(--spacing)*2.2)] text-ink lg:px-3`}
      >
        <span className="block">One engine.</span>
        <span className="block">Two players.</span>
        <span className="block">One state of truth.</span>
      </p>
      <div className="flex flex-1 flex-col justify-end gap-[calc(var(--spacing)*2.6)] px-[12px] py-[calc(var(--spacing)*3.6)] lg:px-3">
        <h3 id={titleId} className={`${display.l} max-w-[13ch]`}>
          Test every world before anyone plays it
        </h3>
        <p className={`${body.m} max-w-[44ch] text-ink-72`}>
          The agent you watch and the player you are both move through the same game rules, so a
          door that stops one stops the other. Every run is replayed on its exact revision.
        </p>
      </div>
      <ul>
        {features.map((feature) => (
          <li
            key={feature.text}
            className="flex h-[calc(var(--spacing)*6.4)] items-stretch border-t border-rule"
          >
            <span
              className={`${body.m} flex flex-1 items-center px-[12px] text-ink lg:px-3 lg:text-[length:calc(var(--spacing)*1.8)]`}
            >
              {feature.text}
            </span>
            <span className="flex w-[calc(var(--spacing)*6.4)] items-center justify-center border-l border-rule text-ink/60">
              <HugeiconsIcon icon={feature.icon} aria-hidden size={20} strokeWidth={1.3} />
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
