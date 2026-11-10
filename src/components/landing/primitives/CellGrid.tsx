import type { ReactNode } from "react";

const columnClass = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

type CellGridProps = {
  columns: keyof typeof columnClass;
  children: ReactNode;
  className?: string;
};

export function CellGrid({ columns, children, className = "" }: CellGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-px bg-rule ${columnClass[columns]} ${className}`}>
      {children}
    </div>
  );
}

type CellProps = {
  children: ReactNode;
  className?: string;
};

export function Cell({ children, className = "" }: CellProps) {
  return (
    <div className={`flex flex-col justify-between gap-4 bg-paper p-[12px] lg:p-3 ${className}`}>
      {children}
    </div>
  );
}
