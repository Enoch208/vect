import { useMemo, type ReactNode } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import type { Stroke, StrokeTone, Weight } from "./paths.js";
import { ElevationGuides } from "./ElevationGuides.js";
import { sectionDrawing } from "./section-geometry.js";

const strokeWidth: Record<Weight, number> = { heavy: 1.15, light: 0.8, hair: 0.5 };

const toneClass: Record<StrokeTone, string> = {
  ink: "text-ink",
  key: "text-caution",
  door: "text-accent",
  portal: "text-accent",
  switch: "text-positive",
  goal: "text-positive",
  player: "text-ink",
};

const tones: readonly StrokeTone[] = ["ink", "key", "switch", "door", "portal", "goal", "player"];

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
  architectural?: boolean;
};

export function Elevation({
  world,
  className = "",
  showLabels = true,
  view,
  underlay,
  architectural = false,
}: ElevationProps) {
  const drawing = useMemo(() => sectionDrawing(world), [world]);
  const box = view ?? { x: 0, y: drawing.y, width: drawing.width, height: drawing.height };
  return (
    <svg
      role="img"
      aria-label={`Level drawing of ${world.title}: ${world.rooms.map((room) => room.label).join(", ")}`}
      viewBox={`${String(box.x)} ${String(box.y)} ${String(box.width)} ${String(box.height)}`}
      fill="none"
      className={`block h-auto w-full ${className}`}
    >
      {architectural && <ElevationGuides drawing={drawing} />}
      {underlay}
      <g data-elevation-ink={architectural ? "" : undefined}>
        {tones.map((tone) => (
          <StrokeGroup key={tone} tone={tone} strokes={drawing.strokes} />
        ))}
      </g>
      {showLabels && (
        <g
          data-elevation-labels={architectural ? "" : undefined}
          className="fill-muted font-mono text-[11px] tracking-[0.04em] uppercase"
        >
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

function StrokeGroup({ tone, strokes }: { tone: StrokeTone; strokes: readonly Stroke[] }) {
  const drawn = strokes.filter((stroke) => (stroke.tone ?? "ink") === tone);
  if (drawn.length === 0) return null;
  return (
    <g
      className={toneClass[tone]}
      stroke="currentColor"
      fill={tone === "player" ? "currentColor" : "none"}
      strokeLinejoin="miter"
      strokeLinecap="butt"
    >
      {drawn.map((stroke) => (
        <path
          key={stroke.id}
          d={stroke.d}
          data-draw=""
          data-start={stroke.start.toFixed(3)}
          strokeWidth={tone === "player" ? 1.65 : strokeWidth[stroke.weight]}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}
