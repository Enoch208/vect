import type { GameState } from "../../../contract/game.schema.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import type { Point } from "../../world/layout.js";
import { worldRevisionHash } from "../../../domain/canonical.js";
import { sequenceIndex } from "../primitives/Sequence.js";
import { along, tracePoints } from "./fault-trace.js";
import { walkthrough } from "./walkthrough-steps.js";

export type Layer = "structure" | "detail" | "agent" | "dimension";

export type WalkFrame = {
  label: string;
  text: string;
  layers: readonly Layer[];
  state: GameState | null;
  agent: Point | null;
  path: Point[];
  final: boolean;
};

export function walkthroughFrames(world: WorldSpec): WalkFrame[] {
  const { start, steps, replay } = walkthrough(world);
  const points = tracePoints(world);
  const kinds = new Set(world.entities.map((item) => item.kind));
  const intro: WalkFrame[] = [
    {
      label: "Introduction",
      text: `${world.title}: ${String(world.rooms.length)} rooms and ${String(world.connections.length)} ways between them, drawn straight from the world file.`,
      layers: ["structure"],
      state: start,
      agent: null,
      path: [],
      final: false,
    },
    {
      label: "Introduction",
      text: `Every symbol is an entity the engine knows${kinds.has("key") ? ": a key, its door" : ""}${kinds.has("switch") ? ", a switch" : ""}${kinds.has("portal") ? " and a portal" : ""}. The agent plays them by the same rules as you.`,
      layers: ["structure", "detail"],
      state: start,
      agent: points[0]?.point ?? null,
      path: [],
      final: false,
    },
  ];
  const walked = steps.map((step, index) => {
    const traced = along(points, index + 1);
    return {
      label: `Step ${sequenceIndex(step.index + 1)} · ${step.code}`,
      text: step.caption,
      layers: ["structure", "detail", "agent"] as const,
      state: step.state,
      agent: traced.at,
      path: traced.path,
      final: false,
    };
  });
  const last = walked.at(-1);
  const outro: WalkFrame = {
    label: "Replay",
    text: replay.pass
      ? `Replayed on revision ${worldRevisionHash(world).slice(0, 6)}: the same ${String(steps.length)} moves give the same states.`
      : `The replay did not match at step ${String(replay.mismatchAt ?? 0)}.`,
    layers: ["structure", "detail", "agent", "dimension"],
    state: last?.state ?? start,
    agent: last?.agent ?? null,
    path: last?.path ?? [],
    final: true,
  };
  return [...intro, ...walked, outro];
}
