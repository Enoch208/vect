import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { runPlaytest } from "../../src/agents/playtest.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { checkWorld } from "../../src/verification/check-world.js";
import { Plan } from "../../src/components/landing/blueprint/Plan.js";
import { findingCallouts } from "../../src/components/landing/blueprint/plan-callouts.js";
import { walkthroughSteps } from "../../src/components/landing/sections/walkthrough-steps.js";
import { roomEvents } from "../../src/components/landing/sections/room-events.js";

function calloutTarget(html: string, code: string): string | undefined {
  const match = new RegExp(`data-target="([^"]+)"[^>]*data-code="${code}"`).exec(html);
  return match?.[1];
}

describe("blueprint plans", () => {
  it("the twin's plan pins the solver's real finding code on door1", () => {
    const check = checkWorld(observatoryKeyBehindDoor);
    const callouts = findingCallouts(observatoryKeyBehindDoor, check);
    expect(callouts).toEqual([{ targetId: "door1", code: "CIRCULAR_DEPENDENCY" }]);
    const html = renderToString(<Plan world={observatoryKeyBehindDoor} callouts={callouts} />);
    expect(html).toContain("CIRCULAR_DEPENDENCY");
    expect(calloutTarget(html, "CIRCULAR_DEPENDENCY")).toBe("door1");
  });

  it("a solvable world gets no fault callouts", () => {
    expect(findingCallouts(observatory, checkWorld(observatory))).toEqual([]);
  });

  it("missing solver output renders the plan without callouts", () => {
    const html = renderToString(<Plan world={observatoryKeyBehindDoor} callouts={null} />);
    expect(html).not.toContain("CIRCULAR_DEPENDENCY");
    for (const room of observatoryKeyBehindDoor.rooms) expect(html).toContain(room.label);
  });

  it("walkthrough captions come from the real winning trace", () => {
    const run = runPlaytest(observatory, { seed: observatory.seed, now: () => 0 });
    const steps = walkthroughSteps(observatory);
    expect(run.outcome).toBe("GOAL_REACHED");
    expect(steps.map((step) => step.caption)).toEqual(run.summaries);
    expect(steps.map((step) => step.code)).toEqual(run.trace.map((step) => step.eventCode));
  });

  it("every room fragment carries an event the engine really returned", () => {
    const events = roomEvents();
    expect(events.map((event) => event.code)).toEqual([
      "DOOR_LOCKED",
      "ITEM_COLLECTED",
      "FLAG_SET",
      "GOAL_COMPLETE",
    ]);
    for (const event of events) expect(event.message.length).toBeGreaterThan(0);
  });
});
