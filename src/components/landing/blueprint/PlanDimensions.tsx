import type { SceneLayout } from "../../world/layout.js";

const stroke = { vectorEffect: "non-scaling-stroke" as const, strokeWidth: 0.6 };
const text = "fill-muted font-mono text-[0.5px] tracking-[0.04em]";

function format(value: number): string {
  return value.toFixed(1);
}

function Run({ from, to, z, label }: { from: number; to: number; z: number; label: string }) {
  return (
    <g>
      <path d={`M${String(from)} ${String(z)}H${String(to)}`} {...stroke} />
      <path
        d={`M${String(from)} ${String(z - 0.4)}v0.8M${String(to)} ${String(z - 0.4)}v0.8`}
        {...stroke}
      />
      <text x={(from + to) / 2} y={z - 0.35} textAnchor="middle" className={text} stroke="none">
        {label}
      </text>
    </g>
  );
}

export function PlanDimensions({ layout }: { layout: SceneLayout }) {
  const { bounds } = layout;
  const near = bounds.minZ - 1.6;
  const far = bounds.minZ - 3.2;
  return (
    <g data-layer="dimension" className="stroke-muted">
      {layout.rooms.map((room) => (
        <Run
          key={room.id}
          from={room.center[0] - room.size / 2}
          to={room.center[0] + room.size / 2}
          z={near}
          label={format(room.size)}
        />
      ))}
      {layout.corridors
        .filter((corridor) => corridor.axis === "x")
        .map((corridor) => (
          <Run
            key={corridor.connectionId}
            from={Math.min(corridor.from[0], corridor.to[0])}
            to={Math.max(corridor.from[0], corridor.to[0])}
            z={near}
            label={format(Math.abs(corridor.to[0] - corridor.from[0]))}
          />
        ))}
      <Run from={bounds.minX} to={bounds.maxX} z={far} label={format(bounds.maxX - bounds.minX)} />
    </g>
  );
}
