export function VectMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      className={className}
    >
      <path d="M3 3h18v18H11" />
      <path d="M3 3v12" />
      <path d="M3 21h1" />
      <path d="M4 21a7 7 0 0 1 7-7" strokeWidth="1" />
      <path d="M11 14v7" strokeWidth="1" />
    </svg>
  );
}
