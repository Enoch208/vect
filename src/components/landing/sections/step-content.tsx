import type { ReactNode } from "react";
import { worldLimits } from "../../../contract/limits.js";
import { repairAllowedOperations } from "../../../contract/patch.schema.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { checkWorld } from "../../../verification/check-world.js";
import { Elevation } from "../blueprint/Elevation.js";
import { Plan } from "../blueprint/Plan.js";
import { findingCallouts } from "../blueprint/plan-callouts.js";
import { Sequence } from "../primitives/Sequence.js";
import { SpecSheet } from "../primitives/SpecSheet.js";
import { along, tracePoints } from "./fault-trace.js";
import { walkthroughSteps } from "./walkthrough-steps.js";

export type Step = {
  name: string;
  caption: string;
  drawing: ReactNode;
  detail: ReactNode;
};

const modeLabel = {
  live_ai: "AI generated",
  deterministic_parser: "Parser",
  sample_fixture: "Example world",
} as const;

export function stepsFor(world: WorldSpec, twin: WorldSpec): Step[] {
  const check = checkWorld(twin);
  const twinPoints = tracePoints(twin);
  const stuck = along(twinPoints, twinPoints.length - 1);
  const trace = walkthroughSteps(world);
  return [
    {
      name: "Generate",
      caption: "Describe a world; the model returns a strict, checked world file.",
      drawing: <Elevation world={world} />,
      detail: (
        <SpecSheet
          title="World file"
          rows={[
            { key: "World", value: world.id },
            { key: "Rooms", value: String(world.rooms.length) },
            { key: "Ways", value: String(world.connections.length) },
            { key: "Entities", value: String(world.entities.length) },
            { key: "Made by", value: modeLabel[world.generationMode] },
          ]}
        />
      ),
    },
    {
      name: "Play",
      caption: "You walk it in 3D; every move goes through the rules the agent uses.",
      drawing: (
        <Plan world={world} agent={tracePoints(world)[0]?.point ?? null} dimensions={false} />
      ),
      detail: (
        <Sequence
          items={trace.map((step) => ({
            index: step.index + 1,
            label: `${step.code} · ${step.caption}`,
            done: true,
          }))}
        />
      ),
    },
    {
      name: "Test",
      caption: "The agent plays it for real, and the solver proves what can be reached.",
      drawing: (
        <Plan
          world={twin}
          agent={stuck.at}
          path={stuck.path}
          callouts={findingCallouts(twin, check)}
          dimensions={false}
        />
      ),
      detail: (
        <SpecSheet
          title="Solver"
          rows={[
            { key: "Status", value: check.solvability?.status ?? "not run" },
            { key: "Explored", value: `${String(check.solvability?.exploredStates ?? 0)} states` },
            { key: "Finding", value: check.solvability?.findings[0]?.code ?? "none" },
          ]}
        />
      ),
    },
    {
      name: "Repair",
      caption: "A bounded patch keeps your goal; only a fresh run and a replay can say VERIFIED.",
      drawing: <Plan world={twin} callouts={findingCallouts(twin, check)} dimensions={false} />,
      detail: (
        <SpecSheet
          title="Repair rules"
          rows={[
            { key: "May use", value: repairAllowedOperations.join(", ") },
            { key: "Attempts", value: `at most ${String(worldLimits.repairAttempts)}` },
            { key: "Verified by", value: "fresh agent run + replay" },
          ]}
        />
      ),
    },
  ];
}
