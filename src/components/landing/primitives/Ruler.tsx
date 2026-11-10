const horizontalTicks =
  "bg-[repeating-linear-gradient(to_right,var(--color-faint)_0_1px,transparent_1px_7px)]";
const verticalTicks =
  "bg-[repeating-linear-gradient(to_bottom,var(--color-faint)_0_1px,transparent_1px_7px)]";

export function Crosshair({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`absolute block size-[calc(var(--spacing)*1.3)] ${className}`}>
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-muted" />
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-muted" />
    </span>
  );
}

type RulerProps = {
  top?: boolean;
  bottom?: boolean;
  sides?: boolean;
};

export function Ruler({ top = true, bottom = true, sides = true }: RulerProps) {
  const corner = "-translate-1/2";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {top && (
        <>
          <Crosshair
            className={`top-[calc(var(--spacing)*1.4)] left-[calc(var(--spacing)*1.4)] ${corner}`}
          />
          <Crosshair
            className={`top-[calc(var(--spacing)*1.4)] right-[calc(var(--spacing)*1.4)] translate-x-1/2 -translate-y-1/2`}
          />
          <span
            className={`absolute top-[calc(var(--spacing)*1.1)] right-[calc(var(--spacing)*3.1)] left-[calc(var(--spacing)*3.1)] h-[calc(var(--spacing)*0.6)] ${horizontalTicks}`}
          />
        </>
      )}
      {bottom && (
        <>
          <Crosshair
            className={`bottom-[calc(var(--spacing)*1.4)] left-[calc(var(--spacing)*1.4)] -translate-x-1/2 translate-y-1/2`}
          />
          <Crosshair
            className={`right-[calc(var(--spacing)*1.4)] bottom-[calc(var(--spacing)*1.4)] translate-1/2`}
          />
          <span
            className={`absolute right-[calc(var(--spacing)*3.1)] bottom-[calc(var(--spacing)*1.1)] left-[calc(var(--spacing)*3.1)] h-[calc(var(--spacing)*0.6)] ${horizontalTicks}`}
          />
        </>
      )}
      {sides && (
        <>
          <span
            className={`absolute top-[calc(var(--spacing)*3.1)] bottom-[calc(var(--spacing)*3.1)] left-[calc(var(--spacing)*1.1)] w-[calc(var(--spacing)*0.6)] ${verticalTicks}`}
          />
          <span
            className={`absolute top-[calc(var(--spacing)*3.1)] right-[calc(var(--spacing)*1.1)] bottom-[calc(var(--spacing)*3.1)] w-[calc(var(--spacing)*0.6)] ${verticalTicks}`}
          />
        </>
      )}
    </div>
  );
}
