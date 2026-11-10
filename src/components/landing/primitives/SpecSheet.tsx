import { mono } from "./type.js";

export type SpecRow = { key: string; value: string };

type SpecSheetProps = {
  title: string;
  rows: readonly SpecRow[];
  className?: string;
};

export function SpecSheet({ title, rows, className = "" }: SpecSheetProps) {
  return (
    <div className={`${mono.xxs} w-[calc(var(--spacing)*27.6)] text-muted ${className}`}>
      <p>{title}</p>
      <p aria-hidden className="overflow-hidden whitespace-nowrap">
        {"-".repeat(96)}
      </p>
      <dl className="mt-[calc(var(--spacing)*0.4)] flex flex-col gap-y-[calc(var(--spacing)*0.4)]">
        {rows.map((row) => (
          <div key={row.key} className="flex">
            <dt className="w-[calc(var(--spacing)*8)] shrink-0">{row.key}</dt>
            <dd className="flex min-w-0">
              <span aria-hidden className="shrink-0 pr-[1ch]">
                :
              </span>
              <span className="min-w-0">{row.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
