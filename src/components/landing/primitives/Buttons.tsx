import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { mono } from "./type.js";

const variants = {
  primary: {
    shell: "bg-accent text-paper-raised hover:bg-ink",
    divider: "bg-[repeating-linear-gradient(to_bottom,currentColor_0_3px,transparent_3px_5px)]",
  },
  outline: {
    shell: "border border-rule bg-paper text-ink hover:border-ink",
    divider:
      "bg-[repeating-linear-gradient(to_bottom,var(--color-rule)_0_3px,transparent_3px_5px)]",
  },
} as const;

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: keyof typeof variants;
  className?: string;
};

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function Arrow() {
  return (
    <HugeiconsIcon
      icon={ArrowRight02Icon}
      aria-hidden
      size="1em"
      strokeWidth={1.5}
      className="transition-transform duration-300 ease-[cubic-bezier(.4,0,0,1)] group-hover:translate-x-[3px] motion-reduce:transition-none"
    />
  );
}

export function Button({ children, onClick, variant = "primary", className = "" }: ButtonProps) {
  const style = variants[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex h-[calc(var(--spacing)*4.9)] items-stretch transition-colors duration-300 ${mono.label} ${style.shell} ${focus} ${className}`}
    >
      <span className="flex items-center px-[calc(var(--spacing)*1.6)]">{children}</span>
      <span aria-hidden className={`my-[calc(var(--spacing)*0.6)] w-px ${style.divider}`} />
      <span className="flex w-[calc(var(--spacing)*4.4)] items-center justify-center text-[1.2em]">
        <Arrow />
      </span>
    </button>
  );
}

type TextButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
};

export function TextButton({ children, onClick, href, className = "" }: TextButtonProps) {
  const style = `group inline-flex items-center gap-[0.6em] text-accent ${mono.label} ${focus} ${className}`;
  if (href !== undefined) {
    return (
      <a href={href} className={style}>
        {children}
        <Arrow />
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={style}>
      {children}
      <Arrow />
    </button>
  );
}
