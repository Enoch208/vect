import { describe, expect, it } from "vitest";
import {
  directionTarget,
  keyDirection,
  nearestUsable,
} from "../../src/components/world/controls.js";
import { layoutWorld } from "../../src/components/world/layout.js";
import { createInitialState, stepGame } from "../../src/domain/step-game.js";
import { connection, derive } from "../../src/fixtures/build.js";
import { observatory } from "../../src/fixtures/observatory.js";
import { tenRoomTemple } from "../../src/fixtures/suite-large.js";

describe("directionTarget", () => {
  it("picks the adjacent room in each grid direction and null where there is none", () => {
    expect(directionTarget(tenRoomTemple, "atrium", "w")).toBe("west");
    expect(directionTarget(tenRoomTemple, "atrium", "e")).toBe("east");
    expect(directionTarget(tenRoomTemple, "atrium", "s")).toBe("north");
    expect(directionTarget(tenRoomTemple, "atrium", "n")).toBeNull();
    expect(directionTarget(tenRoomTemple, "west", "s")).toBe("garden");
    expect(directionTarget(observatory, "portal", "e")).toBeNull();
    expect(directionTarget(observatory, "nowhere", "e")).toBeNull();
  });

  it("only offers rooms the current room is connected to", () => {
    expect(directionTarget(tenRoomTemple, "garden", "e")).toBeNull();
    expect(directionTarget(tenRoomTemple, "garden", "w")).toBe("crypt");
  });

  it("reaches a linked room that is further away in that direction", () => {
    const linked = derive(observatory, {
      connections: [...observatory.connections, connection("c4", "entrance", "control")],
    });
    expect(directionTarget(linked, "entrance", "e")).toBe("library");
    expect(directionTarget(linked, "control", "w")).toBe("library");
    const skipping = derive(observatory, {
      connections: [
        connection("c1", "entrance", "control"),
        connection("c2", "library", "control"),
        connection("c3", "control", "portal"),
      ],
    });
    expect(directionTarget(skipping, "entrance", "e")).toBe("control");
  });
});

describe("keyboard mapping", () => {
  it("maps W A S D and the arrows to grid directions", () => {
    expect(["KeyW", "KeyA", "KeyS", "KeyD"].map(keyDirection)).toEqual(["n", "w", "s", "e"]);
    expect(["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].map(keyDirection)).toEqual([
      "n",
      "w",
      "s",
      "e",
    ]);
    expect(keyDirection("KeyE")).toBeNull();
  });

  it("finds the nearest unused interactive entity in the current room", () => {
    const layout = layoutWorld(observatory);
    const start = createInitialState(observatory, observatory.seed);
    expect(nearestUsable(observatory, layout, start)).toBeNull();
    const inLibrary = stepGame(observatory, start, { type: "MOVE_TO", roomId: "library" }).state;
    expect(nearestUsable(observatory, layout, inLibrary)).toBe("key1");
    const taken = stepGame(observatory, inLibrary, { type: "INTERACT", entityId: "key1" }).state;
    expect(nearestUsable(observatory, layout, taken)).toBeNull();
  });
});
