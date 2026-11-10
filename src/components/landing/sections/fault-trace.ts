import type { WorldSpec } from "../../../contract/world.schema.js";
import type { Point } from "../../world/layout.js";
import { agentPoint, startPoint } from "../blueprint/agent-points.js";
import { planGeometry } from "../blueprint/plan-geometry.js";
import { walkthrough, type WalkthroughStep } from "./walkthrough-steps.js";

export type TracePoint = { point: Point; step: WalkthroughStep | null };

export function tracePoints(world: WorldSpec): TracePoint[] {
  const { layout } = planGeometry(world);
  const { start, steps } = walkthrough(world);
  const origin = startPoint(layout, start);
  const points: TracePoint[] = origin === null ? [] : [{ point: origin, step: null }];
  let before = start;
  for (const step of steps) {
    const point = agentPoint(layout, before, step.action, step.accepted);
    if (point !== null) points.push({ point, step });
    before = step.state;
  }
  return points;
}

export function along(
  points: readonly TracePoint[],
  progress: number,
): { at: Point; path: Point[] } {
  const last = points.length - 1;
  const clamped = Math.max(0, Math.min(last, progress));
  const whole = Math.floor(clamped);
  const from = points[whole]?.point ?? [0, 0];
  const to = points[Math.min(last, whole + 1)]?.point ?? from;
  const t = clamped - whole;
  const at: Point = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
  return { at, path: [...points.slice(0, whole + 1).map((item) => item.point), at] };
}
