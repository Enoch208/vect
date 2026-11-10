import { describe, expect, it } from "vitest";
import type { GameAction, GameState } from "../../src/contract/game.schema.js";
import { layoutWorld } from "../../src/components/world/layout.js";
import { continues, transitionKind } from "../../src/components/world/transition.js";
import { stride, walkRoute } from "../../src/components/world/walk.js";
import { createInitialState, stepGame } from "../../src/domain/step-game.js";
import { connection, derive } from "../../src/fixtures/build.js";
import { observatory } from "../../src/fixtures/observatory.js";

function after(actions: GameAction[]): GameState {
  return actions.reduce(
    (state, action) => stepGame(observatory, state, action).state,
    createInitialState(observatory, observatory.seed),
  );
}

const toLibrary: GameAction = { type: "MOVE_TO", roomId: "library" };
const takeKey: GameAction = { type: "INTERACT", entityId: "key1" };
const toControl: GameAction = { type: "MOVE_TO", roomId: "control" };
const flipSwitch: GameAction = { type: "INTERACT", entityId: "switch1" };

describe("transitionKind", () => {
  it("is unlock when unlockedDoors grows", () => {
    expect(
      transitionKind(after([toLibrary, takeKey]), after([toLibrary, takeKey, toControl])),
    ).toBe("unlock");
  });

  it("is pickup when inventory grows", () => {
    expect(transitionKind(after([toLibrary]), after([toLibrary, takeKey]))).toBe("pickup");
  });

  it("is move when only the room changes and flag when a switch is thrown", () => {
    expect(transitionKind(after([]), after([toLibrary]))).toBe("move");
    const inControl = after([toLibrary, takeKey, toControl]);
    expect(transitionKind(inControl, after([toLibrary, takeKey, toControl, flipSwitch]))).toBe(
      "flag",
    );
  });

  it("is none for identical states and for a refused action", () => {
    const start = after([]);
    expect(transitionKind(start, start)).toBe("none");
    const refused = stepGame(observatory, start, { type: "MOVE_TO", roomId: "control" });
    expect(refused.ok).toBe(false);
    expect(transitionKind(start, refused.state)).toBe("none");
  });

  it("only animates between consecutive states of one run", () => {
    expect(continues(after([]), after([toLibrary]))).toBe(true);
    expect(continues(after([toLibrary, takeKey]), after([]))).toBe(false);
    expect(continues(after([]), { ...after([toLibrary]), worldRevisionHash: "other" })).toBe(false);
  });
});

describe("walkRoute", () => {
  const layout = layoutWorld(observatory);
  const centre = (id: string) => {
    const room = layout.rooms.find((item) => item.id === id);
    if (room === undefined) throw new Error(`no room ${id}`);
    return room.center;
  };

  it("walks through both doorways instead of cutting through walls", () => {
    const route = walkRoute(
      layout,
      centre("entrance"),
      "entrance",
      centre("library"),
      "library",
      new Set(["c1"]),
    );
    expect(route?.legs).toHaveLength(3);
    expect(route?.legs.every((leg) => !leg.hidden)).toBe(true);
    const half = stride(route ?? { legs: [], length: 0 }, (route?.length ?? 0) / 2);
    expect(half.point[1]).toBeCloseTo(0);
    expect(half.point[0]).toBeGreaterThan(centre("entrance")[0]);
    expect(half.point[0]).toBeLessThan(centre("library")[0]);
    const end = stride(route ?? { legs: [], length: 0 }, 1000);
    expect(end.point).toEqual(centre("library"));
  });

  it("returns no route between rooms that are not connected", () => {
    expect(
      walkRoute(layout, centre("entrance"), "entrance", centre("portal"), "portal", new Set()),
    ).toBeNull();
  });

  it("hides the figure while it crosses a portal pair", () => {
    const linked = derive(observatory, {
      connections: [...observatory.connections, connection("c4", "entrance", "control")],
    });
    const linkedLayout = layoutWorld(linked);
    const route = walkRoute(linkedLayout, [0, 0], "entrance", [28, 0], "control", new Set(["c4"]));
    expect(route?.legs.map((leg) => leg.hidden)).toEqual([false, true, false]);
    const first = route?.legs[0];
    const midJump = stride(
      route ?? { legs: [], length: 0 },
      Math.hypot((first?.to[0] ?? 0) - 0, (first?.to[1] ?? 0) - 0) + 1,
    );
    expect(midJump.hidden).toBe(true);
  });
});
