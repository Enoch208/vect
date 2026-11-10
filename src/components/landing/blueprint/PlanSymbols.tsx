import type { GameState } from "../../../contract/game.schema.js";
import type { WorldEntity } from "../../../contract/world.schema.js";
import type { CorridorLayout, Point } from "../../world/layout.js";
import { gapWidth } from "./plan-geometry.js";

const hair = { vectorEffect: "non-scaling-stroke" as const, strokeWidth: 0.75 };
const line = { vectorEffect: "non-scaling-stroke" as const, strokeWidth: 1.1 };

type GlyphProps = { entity: WorldEntity; at: Point; used: boolean };

export function EntityGlyph({ entity, at, used }: GlyphProps) {
  const [x, z] = at;
  const tone = used ? "stroke-ink/30" : "stroke-ink";
  switch (entity.kind) {
    case "key":
      return (
        <g className={tone} {...line}>
          <circle cx={x - 0.45} cy={z} r={0.3} />
          <path
            d={`M${String(x - 0.15)} ${String(z)}H${String(x + 0.7)}M${String(x + 0.45)} ${String(z)}v0.3M${String(x + 0.7)} ${String(z)}v0.35`}
          />
        </g>
      );
    case "switch":
      return (
        <g className={tone} {...line}>
          <rect x={x - 0.4} y={z - 0.4} width={0.8} height={0.8} />
          <path
            d={`M${String(x - 0.4)} ${String(z + 0.4)}L${String(x + 0.4)} ${String(z - 0.4)}`}
          />
        </g>
      );
    case "goal":
      return (
        <g className={tone} {...line}>
          <circle cx={x} cy={z} r={1} />
          <circle cx={x} cy={z} r={0.45} />
          <path
            d={`M${String(x - 1.4)} ${String(z)}H${String(x + 1.4)}M${String(x)} ${String(z - 1.4)}V${String(z + 1.4)}`}
            {...hair}
          />
        </g>
      );
    case "chest":
    case "barrier":
    case "trap":
    case "checkpoint":
      return (
        <g className={tone} {...line}>
          <rect x={x - 0.5} y={z - 0.35} width={1} height={0.7} />
          <path d={`M${String(x - 0.5)} ${String(z)}H${String(x + 0.5)}`} />
        </g>
      );
    case "prop":
      return (
        <g className="stroke-ink/55" {...hair}>
          <rect x={x - 0.8} y={z - 0.55} width={1.6} height={1.1} />
          <path
            d={`M${String(x - 0.8)} ${String(z - 0.55)}L${String(x + 0.8)} ${String(z + 0.55)}M${String(x + 0.8)} ${String(z - 0.55)}L${String(x - 0.8)} ${String(z + 0.55)}`}
          />
        </g>
      );
    case "door":
    case "portal":
      return null;
  }
}

type GateProps = { corridor: CorridorLayout; into: Point; kind: "door" | "portal"; open: boolean };

export function GateGlyph({ corridor, into, kind, open }: GateProps) {
  const [gx, gz] = corridor.gate;
  const half = gapWidth / 2;
  if (kind === "portal") {
    return (
      <g className={open ? "stroke-ink" : "stroke-accent"} {...line}>
        <circle cx={gx} cy={gz} r={half} />
        <circle cx={gx} cy={gz} r={half * 0.55} {...hair} />
      </g>
    );
  }
  if (!open) {
    const closed =
      corridor.axis === "x"
        ? `M${String(gx)} ${String(gz - half)}V${String(gz + half)}`
        : `M${String(gx - half)} ${String(gz)}H${String(gx + half)}`;
    return (
      <path
        d={closed}
        className="stroke-accent"
        vectorEffect="non-scaling-stroke"
        strokeWidth={2.4}
      />
    );
  }
  const dir = corridor.axis === "x" ? Math.sign(into[0] - gx) || 1 : Math.sign(into[1] - gz) || 1;
  const leaf =
    corridor.axis === "x"
      ? `M${String(gx)} ${String(gz - half)}h${String(dir * gapWidth)}`
      : `M${String(gx - half)} ${String(gz)}v${String(dir * gapWidth)}`;
  const sweep = dir > 0 ? 1 : 0;
  const arc =
    corridor.axis === "x"
      ? `M${String(gx + dir * gapWidth)} ${String(gz - half)}A${String(gapWidth)} ${String(gapWidth)} 0 0 ${String(sweep)} ${String(gx)} ${String(gz + half)}`
      : `M${String(gx - half)} ${String(gz + dir * gapWidth)}A${String(gapWidth)} ${String(gapWidth)} 0 0 ${String(1 - sweep)} ${String(gx + half)} ${String(gz)}`;
  return (
    <g className="stroke-ink">
      <path d={leaf} {...line} />
      <path d={arc} className="stroke-ink/50" {...hair} strokeDasharray="2 2" />
    </g>
  );
}

export function isOpen(state: GameState | null, doorId: string | null): boolean {
  return state !== null && doorId !== null && state.unlockedDoors.includes(doorId);
}
