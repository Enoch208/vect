import { useMemo, type ReactNode } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import type { Weight } from "./paths.js";
import { sectionDrawing } from "./section-geometry.js";

const strokeWidth: Record<Weight, number> = { heavy: 1.5, light: 1, hair: 0.6 };

export function drawingAspect(world: WorldSpec): number {
  const drawing = sectionDrawing(world);
  return drawing.height === 0 ? 1 : drawing.width / drawing.height;
}

export type ViewBox = { x: number; y: number; width: number; height: number };

type ElevationProps = {
  world: WorldSpec;
  className?: string;
  showLabels?: boolean;
  view?: ViewBox;
  underlay?: ReactNode;
};

export function Elevation({
  world,
  className = "",
  showLabels = true,
  view,
  underlay,
}: ElevationProps) {
  const drawing = useMemo(() => sectionDrawing(world), [world]);
  const box = view ?? { x: 0, y: 0, width: drawing.width, height: drawing.height };
  return (
    <svg
      role="img"
      aria-label={`Section drawing of ${world.title}: ${world.rooms.map((room) => room.label).join(", ")}`}
      viewBox={`${String(box.x)} ${String(box.y)} ${String(box.width)} ${String(box.height)}`}
      fill="none"
      className={`block h-auto w-full text-ink/70 ${className}`}
    >
      {underlay}
      <g stroke="currentColor" strokeLinejoin="miter">
        {drawing.strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={stroke.d}
            data-draw=""
            data-start={stroke.start.toFixed(3)}
            strokeWidth={strokeWidth[stroke.weight]}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {showLabels && (
        <g className="fill-muted font-mono text-[11px] tracking-[0.04em] uppercase">
          {drawing.labels.map((label) => (
            <text
              key={label.id}
              x={label.x}
              y={label.y}
              textAnchor={label.anchor}
              data-label=""
              data-start={label.start.toFixed(3)}
            >
              {label.text}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}
