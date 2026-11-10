type Point = readonly [number, number];
type Segment = { kind: "line"; a: Point; b: Point } | { kind: "arc"; d: string };

const overshoot = 9;

function polygon(points: readonly Point[], dx: number): Segment[] {
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length] ?? point;
    return { kind: "line", a: [point[0] + dx, point[1]], b: [next[0] + dx, next[1]] };
  });
}

function letterC(dx: number): Segment[] {
  const x = (value: number) => String(value + dx);
  const lines: Array<[Point, Point]> = [
    [
      [240, 0],
      [80, 0],
    ],
    [
      [0, 80],
      [0, 120],
    ],
    [
      [80, 200],
      [240, 200],
    ],
    [
      [240, 200],
      [240, 164],
    ],
    [
      [240, 164],
      [84, 164],
    ],
    [
      [40, 120],
      [40, 80],
    ],
    [
      [84, 36],
      [240, 36],
    ],
    [
      [240, 36],
      [240, 0],
    ],
  ];
  return [
    ...lines.map(([a, b]): Segment => ({
      kind: "line",
      a: [a[0] + dx, a[1]],
      b: [b[0] + dx, b[1]],
    })),
    { kind: "arc", d: `M${x(80)} 0A80 80 0 0 0 ${x(0)} 80` },
    { kind: "arc", d: `M${x(0)} 120A80 80 0 0 0 ${x(80)} 200` },
    { kind: "arc", d: `M${x(84)} 164A44 44 0 0 1 ${x(40)} 120` },
    { kind: "arc", d: `M${x(40)} 80A44 44 0 0 1 ${x(84)} 36` },
  ];
}

const letters: Segment[] = [
  ...polygon(
    [
      [0, 0],
      [52, 0],
      [130, 158],
      [208, 0],
      [260, 0],
      [152, 200],
      [108, 200],
    ],
    0,
  ),
  ...polygon(
    [
      [0, 0],
      [200, 0],
      [200, 36],
      [40, 36],
      [40, 82],
      [176, 82],
      [176, 118],
      [40, 118],
      [40, 164],
      [200, 164],
      [200, 200],
      [0, 200],
    ],
    340,
  ),
  ...letterC(620),
  ...polygon(
    [
      [0, 0],
      [230, 0],
      [230, 36],
      [133, 36],
      [133, 200],
      [97, 200],
      [97, 36],
      [0, 36],
    ],
    940,
  ),
];

function extended({ a, b }: { a: Point; b: Point }): string {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = ((b[0] - a[0]) / length) * overshoot;
  const uy = ((b[1] - a[1]) / length) * overshoot;
  return `M${String(a[0] - ux)} ${String(a[1] - uy)}L${String(b[0] + ux)} ${String(b[1] + uy)}`;
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Vect"
      viewBox="-24 -24 1218 248"
      fill="none"
      className={`block h-auto w-full text-ink ${className}`}
    >
      <g stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke">
        {letters.map((segment, index) => (
          <path
            key={String(index)}
            d={segment.kind === "line" ? extended(segment) : segment.d}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d="M740 92v16M732 100h16" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
