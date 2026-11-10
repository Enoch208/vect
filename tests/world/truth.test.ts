import { describe, expect, it } from "vitest";
import type { GameAction, GameState } from "../../src/contract/game.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { actorAnchor, pathAnchors, pathLegs } from "../../src/components/world/anchors.js";
import { layoutWorld } from "../../src/components/world/layout.js";
import { gateStates, isUsed, keyOpens, switchIsOn } from "../../src/components/world/truth.js";
import { createInitialState, stepGame } from "../../src/domain/step-game.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";

function play(world: WorldSpec, actions: GameAction[]): GameState {
  return actions.reduce(
    (state, action) => stepGame(world, state, action).state,
    createInitialState(world, world.seed),
  );
}

const toLibrary: GameAction = { type: "MOVE_TO", roomId: "library" };
const takeKey: GameAction = { type: "INTERACT", entityId: "key1" };
const toControl: GameAction = { type: "MOVE_TO", roomId: "control" };
const flipSwitch: GameAction = { type: "INTERACT", entityId: "switch1" };

describe("scene truth", () => {
  it("draws every gated connection closed at the start", () => {
    const gates = gateStates(observatory, play(observatory, []));
    expect(Object.fromEntries(gates)).toEqual({ c1: "open", c2: "closed", c3: "closed" });
  });

  it("opens a door when the engine says it is traversable and marks it passed after use", () => {
    const held = gateStates(observatory, play(observatory, [toLibrary, takeKey]));
    expect(held.get("c2")).toBe("open");
    const through = gateStates(observatory, play(observatory, [toLibrary, takeKey, toControl]));
    expect(through.get("c2")).toBe("passed");
    expect(through.get("c3")).toBe("closed");
  });

  it("keeps the twin's door closed however the player tries", () => {
    const state = play(observatoryKeyBehindDoor, [toLibrary, takeKey, toControl, toControl]);
    expect(state.currentRoomId).toBe("library");
    expect(gateStates(observatoryKeyBehindDoor, state).get("c2")).toBe("closed");
    expect(isUsed(state, "key1")).toBe(false);
  });

  it("shows a pickup gone and a switch on only from state", () => {
    const lever = observatory.entities.find((entity) => entity.id === "switch1");
    if (lever === undefined) throw new Error("switch1 is missing");
    const before = play(observatory, [toLibrary]);
    expect(isUsed(before, "key1")).toBe(false);
    expect(switchIsOn(before, lever)).toBe(false);
    const after = play(observatory, [toLibrary, takeKey, toControl, flipSwitch]);
    expect(isUsed(after, "key1")).toBe(true);
    expect(switchIsOn(after, lever)).toBe(true);
  });

  it("pairs a key and a switch with the connections they open", () => {
    const byId = new Map(observatory.entities.map((entity) => [entity.id, entity]));
    const key = byId.get("key1");
    const lever = byId.get("switch1");
    const prop = byId.get("charts");
    if (!key || !lever || !prop) throw new Error("fixture entities are missing");
    expect(keyOpens(observatory, key)).toEqual(["c2"]);
    expect(keyOpens(observatory, lever)).toEqual(["c3"]);
    expect(keyOpens(observatory, prop)).toEqual([]);
  });
});

describe("actor anchor", () => {
  const layout = layoutWorld(observatory);

  it("stands at the room centre on entry", () => {
    const state = play(observatory, [toLibrary]);
    expect(actorAnchor(observatory, layout, state)).toEqual(
      layout.rooms.find((room) => room.id === "library")?.center,
    );
  });

  it("stands beside the entity it just used, inside the room", () => {
    const state = play(observatory, [toLibrary, takeKey]);
    const [x, z] = actorAnchor(observatory, layout, state);
    const key = layout.entities.find((item) => item.id === "key1");
    const library = layout.rooms.find((room) => room.id === "library");
    if (key === undefined || library === undefined) throw new Error("layout is incomplete");
    expect(Math.hypot(x - key.position[0], z - key.position[2])).toBeLessThan(1.5);
    expect(Math.abs(x - library.center[0])).toBeLessThan(library.size / 2);
    expect(Math.abs(z - library.center[1])).toBeLessThan(library.size / 2);
  });

  it("maps a recorded path onto room centres", () => {
    const points = pathAnchors(observatory, layout, [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
    ]);
    expect(points).toEqual([layout.rooms[0]?.center, layout.rooms[1]?.center]);
  });

  it("draws a recorded path through the doorways, never through a wall", () => {
    const legs = pathLegs(observatory, layout, [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
    ]);
    expect(legs).toHaveLength(3);
    expect(legs[0]?.from).toEqual(layout.rooms[0]?.center);
    expect(legs[2]?.to).toEqual(layout.rooms[1]?.center);
    expect(legs.every((leg) => leg.from[1] === 0 && leg.to[1] === 0)).toBe(true);
    expect(pathLegs(observatory, layout, [{ x: 0, z: 0 }])).toEqual([]);
  });
});
