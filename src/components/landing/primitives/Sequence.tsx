import { mono } from "./type.js";

export type SequenceItem = { index: number; label: string; done: boolean };

type SequenceProps = {
  items: readonly SequenceItem[];
  className?: string;
};

export function sequenceIndex(index: number): string {
  return String(index).padStart(3, "0");
}

export function Sequence({ items, className = "" }: SequenceProps) {
  return (
    <ol className={`${mono.xxs} ${className}`}>
      {items.map((item) => (
        <li
          key={item.index}
          data-done={item.done}
          className={`whitespace-nowrap transition-colors duration-300 ${item.done ? "text-ink" : "text-faint"}`}
        >
          {sequenceIndex(item.index)} {item.label}
        </li>
      ))}
    </ol>
  );
}
