import { useMemo, type ReactNode } from "react";
import type { GameState } from "../../../contract/game.schema.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import type { Point } from "../../world/layout.js";
import { mono } from "../primitives/type.js";
import type { PlanCallout } from "./plan-callouts.js";
import { corridorSides, planGeometry, pointOf, roomOf, type Box } from "./plan-geometry.js";
import { PlanDimensions } from "./PlanDimensions.js";
import { PlanRoom } from "./PlanRoom.js";
import { EntityGlyph, GateGlyph, isOpen } from "./PlanSymbols.js";

type PlanProps = {
  world: WorldSpec;
  state?: GameState | null;
  agent?: Point | null;
  path?: readonly Point[];
  callouts?: readonly PlanCallout[] | null;
  onTargetClick?: (targetId: string) => void;
  tintRoomId?: string | null;
  view?: Box;
  leader?: number;
  dimensions?: boolean;
  className?: string;
  children?: ReactNode;
};

const hair = { vectorEffect: "non-scaling-stroke" as const, strokeWidth: 0.75 };
const leaderLength = 5.2;

export function Plan({
  world,
  state = null,
  agent = null,
  path = [],
  callouts = null,
  onTargetClick,
  tintRoomId = null,
  view,
  leader = leaderLength,
  dimensions = true,
  className = "",
  children,
}: PlanProps) {
  const geometry = useMemo(() => planGeometry(world), [world]);
  const { layout } = geometry;
  const box = view ?? geometry.view;
  const percent = (point: Point) => ({
    left: `${String(((point[0] - box.x) / box.w) * 100)}%`,
    top: `${String(((point[1] - box.z) / box.h) * 100)}%`,
  });
  const pinned = (callouts ?? []).flatMap((callout) => {
    const at = pointOf(layout, callout.targetId);
    if (at === null) return [];
    const flip = (at[0] - box.x) / box.w > 0.62;
    const tip: Point = [at[0] + (flip ? leader * 0.3 : -leader * 0.3), at[1] - leader];
    return [{ ...callout, at, tip, flip }];
  });
  return (
    <div className={`relative ${className}`}>
      <svg
        role="img"
        aria-label={`Plan of ${world.title}`}
        viewBox={`${String(box.x)} ${String(box.z)} ${String(box.w)} ${String(box.h)}`}
        fill="none"
        className="block h-auto w-full [&_*]:[vector-effect:non-scaling-stroke]"
      >
        {layout.corridors.map((corridor) => (
          <g key={corridor.connectionId} data-layer="structure" className="stroke-ink/60">
            {corridorSides(corridor).map(([from, to]) => (
              <path
                key={`${String(from[0])}:${String(from[1])}`}
                d={`M${String(from[0])} ${String(from[1])}L${String(to[0])} ${String(to[1])}`}
                {...hair}
              />
            ))}
          </g>
        ))}
        {geometry.walls.map(({ roomId, rects }) => {
          const room = roomOf(layout, roomId);
          return room === undefined ? null : (
            <PlanRoom key={roomId} room={room} walls={rects} tint={roomId === tintRoomId} />
          );
        })}
        <g data-layer="detail">
          {layout.corridors.map((corridor) => {
            const gate = world.entities.find((item) => item.id === corridor.gateEntityId);
            if (!corridor.gated || gate === undefined) return null;
            const into = roomOf(layout, corridor.toRoomId)?.center ?? corridor.to;
            const open =
              isOpen(state, corridor.gateEntityId) ||
              (gate.kind === "portal" && state?.won === true);
            return (
              <GateGlyph
                key={corridor.connectionId}
                corridor={corridor}
                into={into}
                kind={gate.kind === "portal" ? "portal" : "door"}
                open={open}
              />
            );
          })}
          {layout.entities.map((placed) => {
            const entity = world.entities.find((item) => item.id === placed.id);
            if (entity === undefined) return null;
            const used = state?.collectedEntities.includes(entity.id) === true;
            return (
              <EntityGlyph
                key={placed.id}
                entity={entity}
                at={[placed.position[0], placed.position[2]]}
                used={used}
              />
            );
          })}
        </g>
        {dimensions && <PlanDimensions layout={layout} />}
        {path.length > 1 && (
          <path
            data-layer="agent"
            d={path
              .map(
                (point, index) =>
                  `${index === 0 ? "M" : "L"}${String(point[0])} ${String(point[1])}`,
              )
              .join("")}
            className="stroke-accent"
            strokeDasharray="3 3"
            {...hair}
          />
        )}
        {agent !== null && (
          <g
            data-layer="agent"
            data-agent=""
            style={{ transform: `translate(${String(agent[0])}px, ${String(agent[1])}px)` }}
          >
            <circle r={0.95} className="stroke-accent" {...hair} />
            <circle r={0.55} className="fill-accent" />
          </g>
        )}
        {pinned.map((callout) => (
          <path
            key={`leader-${callout.targetId}-${callout.code}`}
            data-layer="callout"
            d={`M${String(callout.at[0])} ${String(callout.at[1])}L${String(callout.tip[0])} ${String(callout.tip[1])}`}
            className="stroke-accent"
            {...hair}
          />
        ))}
        {children}
      </svg>
      {pinned.map((callout) => {
        const chip = `${mono.xs} absolute -translate-y-full ${callout.flip ? "-translate-x-full" : ""} bg-accent px-[0.7em] py-[0.4em] whitespace-nowrap text-paper-raised`;
        const position = percent(callout.tip);
        return onTargetClick === undefined ? (
          <span
            key={`${callout.targetId}-${callout.code}`}
            data-layer="callout"
            data-target={callout.targetId}
            data-code={callout.code}
            className={chip}
            style={position}
          >
            {callout.code}
          </span>
        ) : (
          <button
            key={`${callout.targetId}-${callout.code}`}
            type="button"
            data-layer="callout"
            data-target={callout.targetId}
            data-code={callout.code}
            className={`${chip} cursor-pointer transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
            style={position}
            onClick={() => {
              onTargetClick(callout.targetId);
            }}
          >
            {callout.code}
          </button>
        );
      })}
    </div>
  );
}
