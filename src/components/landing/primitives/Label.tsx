import type { ReactNode } from "react";
import { mono } from "./type.js";

type LabelProps = {
  children: ReactNode;
  className?: string;
};

export function MonoLabel({ children, className = "" }: LabelProps) {
  return <p className={`${mono.label} text-muted ${className}`}>{children}</p>;
}

export function BracketLabel({ children, className = "" }: LabelProps) {
  return <p className={`${mono.xs} text-faint ${className}`}>[{children}]</p>;
}
