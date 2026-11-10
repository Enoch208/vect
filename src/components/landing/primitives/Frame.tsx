export function Frame() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 border-[7px] border-paper max-lg:border-[8px]"
    >
      <div className="size-full border border-rule" />
    </div>
  );
}
