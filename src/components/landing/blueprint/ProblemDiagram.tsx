const drawings = [
  <g key="scene">
    <path d="M48 132L120 90l72 42-72 42Z M48 132v-55l72-42 72 42v55 M120 35v55 M120 174v-55 M48 77l72 42 72-42" />
    <path
      d="M87 151v-32l19 11v32"
      className="text-accent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
    />
    <path d="M48 77l72 42 72-42" strokeDasharray="3 4" />
  </g>,
  <g key="test">
    <path d="M28 136l45-26 45 26-45 26Z M28 136V84l45-26 45 26v52 M28 84l45 26 45-26 M73 110v52 M73 58v52" />
    <path d="M135 104l38-22 38 22-38 22Z M135 104v46l38 22 38-22v-46 M173 126v46" />
    <path d="M102 163l23 13 22-13" strokeDasharray="3 4" className="text-accent" />
  </g>,
  <g key="edit">
    <path d="M65 135l55-32 55 32-55 32Z M65 135V71l55-32 55 32v64 M65 71l55 32 55-32 M120 39v64 M120 103v64" />
    <circle cx="120" cy="103" r="79" strokeDasharray="2 3" />
    <path d="M170 40l9 13-16 2" className="text-accent" />
    <path d="M100 90h36m-5 0v9m-8-9v7" className="text-accent" />
    <circle cx="95" cy="90" r="6" className="text-accent" />
  </g>,
  <g key="proof">
    <path d="M45 89l75-43 75 43-75 44Z M45 89v20l75 43 75-43V89 M120 133v19" />
    <g className="transition-transform duration-700 ease-out group-hover:translate-y-[8px] motion-reduce:transition-none">
      <path d="M45 132l75-43 75 43-75 44Z M45 132v20l75 43 75-43v-20 M120 176v19" />
    </g>
    <path
      d="M103 94l12 7 22-21"
      className="text-accent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
    />
  </g>,
];

export function ProblemDiagram({ index }: { index: number }) {
  return (
    <div
      aria-hidden
      className="relative flex aspect-[1.2] items-center justify-center overflow-hidden border-b border-dashed border-rule"
    >
      <svg
        viewBox="0 0 240 220"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        className="w-[72%] text-muted/60 transition-colors duration-500 group-hover:text-ink"
      >
        <g
          className="text-faint opacity-0 transition-opacity duration-500 group-hover:opacity-60"
          strokeDasharray="10 4 2 4"
        >
          <path d="M0 45H240M0 175H240M45 0V220M195 0V220" />
        </g>
        {drawings[index]}
      </svg>
      <span className="absolute top-3 left-3 size-[5px] bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
