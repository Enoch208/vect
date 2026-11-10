import type { ReactNode } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { checkWorld } from "../../../verification/check-world.js";
import { verifyWorld } from "../../../verification/verify.js";
import { Elevation } from "../blueprint/Elevation.js";
import { Plan } from "../blueprint/Plan.js";
import { findingCallouts } from "../blueprint/plan-callouts.js";
import { SpecSheet } from "../primitives/SpecSheet.js";
import { along, tracePoints } from "./fault-trace.js";
import { roomEvents } from "./room-events.js";
import { RoomFragment } from "./RoomFragment.js";

export const useCaseCopy = [
  {
    title: "Indie developers",
    body: "Describe a level, play it in your browser and know it can be finished before you share it.",
  },
  {
    title: "Game designers",
    body: "Change a rule in plain words and watch the old proof go stale until a new run passes.",
  },
  {
    title: "Level designers",
    body: "See the exact step where a key, a door or a switch stops the run.",
  },
  {
    title: "QA leads",
    body: "Every report carries its revision, seed and trace, and replays to the same result.",
  },
  {
    title: "Educators",
    body: "Show how game logic works with worlds that explain their own faults.",
  },
  {
    title: "Students",
    body: "Learn level design by breaking a world on purpose and reading why it broke.",
  },
  {
    title: "Creative directors",
    body: "Turn a written brief into a world you can walk through, then keep shaping it.",
  },
  {
    title: "Game jams",
    body: "Go from an idea to a playable, tested level without installing anything.",
  },
] as const;

const clock = { now: () => performance.now(), isoNow: () => new Date().toISOString() };

export function caseFigures(world: WorldSpec, twin: WorldSpec): ReactNode[] {
  const walked = tracePoints(world);
  const done = along(walked, walked.length - 1);
  const stuckPoints = tracePoints(twin);
  const stuck = along(stuckPoints, stuckPoints.length - 1);
  const twinCallouts = findingCallouts(twin, checkWorld(twin));
  const events = roomEvents(world);
  const report = verifyWorld(world, { seed: world.seed, ...clock });
  const [locked, collected] = events;
  return [
    <Elevation world={world} />,
    <Plan world={world} agent={done.at} path={done.path} dimensions={false} />,
    <Plan
      world={twin}
      agent={stuck.at}
      path={stuck.path}
      callouts={twinCallouts}
      dimensions={false}
    />,
    <SpecSheet
      title="Verification report"
      rows={[
        { key: "World", value: report.worldId },
        { key: "Revision", value: report.worldRevisionHash.slice(0, 12) },
        { key: "Seed", value: String(report.initialSeed) },
        { key: "Steps", value: String(report.trace.length) },
        { key: "Replay", value: report.replayPass ? "match" : "mismatch" },
        { key: "Status", value: report.status },
        { key: "Digest", value: report.reportDigest.slice(0, 12) },
      ]}
      className="mx-auto origin-center scale-150"
    />,
    locked === undefined ? (
      <Plan world={world} dimensions={false} />
    ) : (
      <RoomFragment world={world} event={locked} />
    ),
    <Plan world={twin} callouts={twinCallouts} dimensions={false} />,
    collected === undefined ? (
      <Plan world={world} dimensions={false} />
    ) : (
      <RoomFragment world={world} event={collected} />
    ),
    <Plan world={world} dimensions={false} />,
  ];
}
