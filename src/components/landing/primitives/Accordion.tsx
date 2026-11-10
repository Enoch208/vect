import { useId, useState } from "react";
import { body, dashedRule, display } from "./type.js";

export type AccordionItem = { title: string; body: string };

type AccordionProps = {
  items: readonly AccordionItem[];
  defaultOpen?: number;
  onOpenChange?: (open: number | null) => void;
  className?: string;
};

export function nextOpenRow(open: number | null, clicked: number): number | null {
  return open === clicked ? null : clicked;
}

function PlusMinus({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className="relative block size-[calc(var(--spacing)*1.3)] shrink-0 text-faint"
    >
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
      <span
        className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform duration-300 ease-[cubic-bezier(.4,0,0,1)] motion-reduce:transition-none ${open ? "scale-y-0" : "scale-y-100"}`}
      />
    </span>
  );
}

export function Accordion({ items, defaultOpen, onOpenChange, className = "" }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(defaultOpen ?? null);
  const baseId = useId();

  function toggle(index: number) {
    const next = nextOpenRow(open, index);
    setOpen(next);
    onOpenChange?.(next);
  }

  return (
    <ul className={className}>
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `${baseId}-panel-${String(index)}`;
        return (
          <li key={item.title} className="group/row">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => {
                toggle(index);
              }}
              className="group flex w-full items-center justify-between gap-3 pt-[calc(var(--spacing)*2.4)] pr-3 pl-3 text-left text-ink focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-accent lg:pl-[calc(var(--spacing)*15.4)]"
            >
              <span className={`${display.list} transition-colors group-hover:text-accent`}>
                {item.title}
              </span>
              <PlusMinus open={isOpen} />
            </button>
            <div
              id={panelId}
              inert={!isOpen}
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.4,0,0,1)] motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p
                  className={`${body.s} pt-[calc(var(--spacing)*0.6)] pr-3 pl-3 text-ink-72 lg:pl-[calc(var(--spacing)*15.4)]`}
                >
                  {item.body}
                </p>
              </div>
            </div>
            <div aria-hidden className="h-[calc(var(--spacing)*2.4)]" />
            <div aria-hidden className={`${dashedRule} group-last/row:hidden`} />
          </li>
        );
      })}
    </ul>
  );
}
