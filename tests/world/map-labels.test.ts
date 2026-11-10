import { describe, expect, it } from "vitest";
import { actorAnchor } from "../../src/components/world/anchors.js";
import type { Box } from "../../src/components/world/map-geometry.js";
import { planMap } from "../../src/components/world/map-model.js";
import { padKey } from "../../src/components/world/map-notes.js";
import type { GameAction } from "../../src/contract/game.schema.js";
import { createInitialState, stepGame } from "../../src/domain/step-game.js";
import { connection, derive, hasItem } from "../../src/fixtures/build.js";
import { observatory } from "../../src/fixtures/observatory.js";

const world = derive(observatory, {
  connections: [
    ...observatory.connections,
    connection("shortcut", "entrance", "control", hasItem("key1")),
    connection("parallel", "entrance", "library"),
  ],
});

function distanceToBox(x: number, z: number, box: Box): number {
  return Math.hypot(
    Math.max(box.x - x, 0, x - box.x - box.w),
    Math.max(box.z - z, 0, z - box.z - box.h),
  );
}

describe("map labels around the actor", () => {
  it("keeps the highlighted shortcut readable beside the starting actor", () => {
    const state = createInitialState(world, world.seed);
    const plan = planMap(world, "shortcut", state);
    const note = plan.notes.pads.get(padKey("shortcut", "from"));
    if (note === undefined) throw new Error("shortcut note is missing");
    expect(note.lines.join(" ")).toBe("SHORTCUT");
    const [x, z] = actorAnchor(world, plan.layout, state);
    expect(distanceToBox(x, z, note.box)).toBeGreaterThanOrEqual(0.8);
  });

  it("keeps captions clear of the actual actor position after moves and interactions", () => {
    const actions: GameAction[] = [
      { type: "MOVE_TO", roomId: "library" },
      { type: "INTERACT", entityId: "key1" },
      { type: "MOVE_TO", roomId: "control" },
      { type: "INTERACT", entityId: "switch1" },
    ];
    let state = createInitialState(world, world.seed);
    for (const action of actions) {
      const result = stepGame(world, state, action);
      expect(result.ok).toBe(true);
      state = result.state;
      const plan = planMap(world, "shortcut", state);
      const [x, z] = actorAnchor(world, plan.layout, state);
      for (const [id, note] of [...plan.notes.titles, ...plan.notes.entities, ...plan.notes.pads]) {
        expect(
          distanceToBox(x, z, note.box),
          `${state.currentRoomId}: ${id}`,
        ).toBeGreaterThanOrEqual(0.8);
      }
    }
  });
});
