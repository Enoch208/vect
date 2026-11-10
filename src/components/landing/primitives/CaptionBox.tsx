import type { ReactNode } from "react";
import { BracketLabel } from "./Label.js";
import { body, mono } from "./type.js";

type CaptionBoxProps = {
  label: string;
  children?: ReactNode;
  hint?: string;
  className?: string;
};

export function CaptionBox({ label, children, hint, className = "" }: CaptionBoxProps) {
  return (
    <figure className={`w-[calc(var(--spacing)*28)] max-lg:w-[calc(100vw-48px)] ${className}`}>
      <div className="border border-rule bg-paper-raised/60">
        <p
          className={`${mono.xs} flex h-[calc(var(--spacing)*3.2)] items-center bg-ink px-[calc(var(--spacing)*1.3)] text-paper-raised`}
        >
          {label}
        </p>
        {children !== undefined && (
          <div
            className={`${body.m} px-[calc(var(--spacing)*1.3)] pt-[calc(var(--spacing)*1.4)] text-ink-72`}
          >
            {children}
          </div>
        )}
        {hint !== undefined && (
          <BracketLabel className="px-[calc(var(--spacing)*1.3)] pt-[calc(var(--spacing)*2)] pb-[calc(var(--spacing)*1.6)]">
            {hint}
          </BracketLabel>
        )}
      </div>
      <div aria-hidden className="mx-px mt-px h-[calc(var(--spacing)*0.6)] bg-ink" />
    </figure>
  );
}
