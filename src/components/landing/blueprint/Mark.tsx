export function VectMark({ className = "", weight = 2 }: { className?: string; weight?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="square"
      className={className}
    >
      <path d="M3 3h18v18H11" />
      <path d="M3 3v12" />
      <path d="M3 21h1" />
      <path d="M4 21a7 7 0 0 1 7-7" strokeWidth={weight / 2} />
      <path d="M11 14v7" strokeWidth={weight / 2} />
    </svg>
  );
}
