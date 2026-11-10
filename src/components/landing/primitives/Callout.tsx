import type { ReactNode } from "react";
import { display, mono } from "./type.js";

type CalloutProps = {
  code: string;
  children?: ReactNode;
  className?: string;
};

export function Callout({ code, children, className = "" }: CalloutProps) {
  return (
    <div
      role="note"
      className={`inline-flex flex-col gap-[calc(var(--spacing)*0.8)] bg-accent px-[calc(var(--spacing)*1.4)] py-[calc(var(--spacing)*1.1)] text-paper-raised ${className}`}
    >
      <p className={`${mono.xs} text-paper-raised/75`}>{code}</p>
      {children !== undefined && (
        <div
          className={`${display.list} max-w-[calc(var(--spacing)*22)] text-[length:calc(var(--spacing)*1.6)] lg:text-[length:calc(var(--spacing)*1.6)]`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function CalloutChip({ code, className = "" }: { code: string; className?: string }) {
  return (
    <span
      className={`${mono.xs} inline-block bg-accent px-[calc(var(--spacing)*0.7)] py-[calc(var(--spacing)*0.4)] text-paper-raised ${className}`}
    >
      {code}
    </span>
  );
}
