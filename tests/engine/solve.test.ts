import { describe, expect, it } from "vitest";
import type { GameAction, GameState } from "../../src/contract/game.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { createInitialState, stepGame } from "../../src/domain/step-game.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import {
  disconnectedGoal,
  duplicateKeys,
  keyBeforeDoor,
  keyBehindOwnDoor,
  lockWithNoUnlockPath,
  routeAroundTrap,
  switchBehindOpenRoute,
  twoLevelCycle,
  twoSequentialLocks,
} from "../../src/fixtures/suite-gameplay.js";
import { tenRoomTemple } from "../../src/fixtures/suite-large.js";
import { doorNeedsMissingKey } from "../../src/fixtures/suite-structural.js";
import { checkWorld } from "../../src/verification/check-world.js";
import { solve } from "../../src/verification/solve.js";
import { validateWorld } from "../../src/verification/validate-world.js";

function replay(world: WorldSpec, path: GameAction[]): GameState {
  let state = createInitialState(world, world.seed);
  for (const action of path) {
    const transition = stepGame(world, state, action);
    expect(transition.ok).toBe(true);
    state = transition.state;
  }
  return state;
}

function expectSolvable(world: WorldSpec) {
  const result = solve(world);
  expect(result.status).toBe("SOLVABLE");
  expect(result.findings).toEqual([]);
  expect(result.path).not.toBeNull();
  expect(replay(world, result.path ?? []).won).toBe(true);
  return result;
}

describe("the gameplay fixtures", () => {
  it("are all structurally sound, so only the solver can judge them", () => {
    const worlds = [
      keyBeforeDoor,
      switchBehindOpenRoute,
      twoSequentialLocks,
      routeAroundTrap,
      keyBehindOwnDoor,
      disconnectedGoal,
      lockWithNoUnlockPath,
      twoLevelCycle,
      duplicateKeys,
      tenRoomTemple,
    ];
    for (const world of worlds) expect(validateWorld(world), world.id).toEqual([]);
  });
});

describe("solve", () => {
  it("observatory is SOLVABLE", () => {
    const result = expectSolvable(observatory);
    expect(result.path).toHaveLength(5);
  });

  it("F-01 twin is PROVEN_UNREACHABLE", () => {
    const result = solve(observatoryKeyBehindDoor);
    expect(result.status).toBe("PROVEN_UNREACHABLE");
    expect(result.path).toBeNull();
    expect(result.findings).toHaveLength(1);
    const [finding] = result.findings;
    expect(finding?.code).toBe("CIRCULAR_DEPENDENCY");
    expect(finding?.entityIds).toEqual(expect.arrayContaining(["key1", "door1"]));
    expect(finding?.explanation).toContain("Access Key");
    expect(finding?.explanation).toContain("behind that same door");
  });

  it("F-02 disconnected goal room", () => {
    const result = solve(disconnectedGoal);
    expect(result.status).toBe("PROVEN_UNREACHABLE");
    expect(result.findings.map((item) => item.code)).toEqual(["UNREACHABLE_GOAL"]);
    expect(result.findings[0]?.explanation).toContain("Portal Chamber");
  });

  it("F-05 a lock with no allowed unlock path fails goal reachability", () => {
    const result = solve(lockWithNoUnlockPath);
    expect(result.status).toBe("PROVEN_UNREACHABLE");
    expect(result.findings.map((item) => item.code)).toEqual(["BLOCKED_EDGE"]);
    expect(result.findings[0]?.entityIds).toContain("c2");
  });

  it("budget exhausted is INCONCLUSIVE", () => {
    const result = solve(observatory, { maxStates: 2 });
    expect(result.status).toBe("INCONCLUSIVE");
    expect(result.path).toBeNull();
    expect(result.exploredStates).toBeLessThanOrEqual(2);
    expect(result.findings.map((item) => item.code)).toEqual(["TEST_BUDGET_EXHAUSTED"]);
  });

  it("budget exhausted on an impossible world is still INCONCLUSIVE, never unreachable", () => {
    expect(solve(observatoryKeyBehindDoor, { maxStates: 1 }).status).toBe("INCONCLUSIVE");
  });

  it("G-01 key before the door is SOLVABLE", () => {
    expectSolvable(keyBeforeDoor);
  });

  it("G-02 switch behind an open route is SOLVABLE", () => {
    expectSolvable(switchBehindOpenRoute);
  });

  it("G-03 two sequential locks", () => {
    const result = expectSolvable(twoSequentialLocks);
    const interactions = (result.path ?? []).filter((action) => action.type === "INTERACT");
    expect(interactions).toEqual([
      { type: "INTERACT", entityId: "key-a" },
      { type: "INTERACT", entityId: "key-b" },
    ]);
  });

  it("G-04 alternate route around a trap", () => {
    const result = expectSolvable(routeAroundTrap);
    expect(result.path).toContainEqual({ type: "MOVE_TO", roomId: "passage" });
  });

  it("two-level cycle names both keys", () => {
    const result = solve(twoLevelCycle);
    expect(result.status).toBe("PROVEN_UNREACHABLE");
    expect(result.findings.every((item) => item.code === "CIRCULAR_DEPENDENCY")).toBe(true);
    expect(result.findings.flatMap((item) => item.entityIds)).toEqual(
      expect.arrayContaining(["west-key", "east-key", "west-door", "east-door"]),
    );
  });

  it("duplicate keys stay solvable", () => {
    expectSolvable(duplicateKeys);
  });

  it("the ten-room temple is SOLVABLE within budget", () => {
    const result = expectSolvable(tenRoomTemple);
    expect(result.exploredStates).toBeLessThan(100_000);
  });

  it("is deterministic", () => {
    expect(solve(tenRoomTemple)).toEqual(solve(tenRoomTemple));
  });
});

describe("checkWorld", () => {
  it("skips the search when the structure is broken", () => {
    const check = checkWorld(doorNeedsMissingKey);
    expect(check.structural.map((item) => item.code)).toEqual(["MISSING_REQUIRED_ITEM"]);
    expect(check.solvability).toBeNull();
  });

  it("reports the twin as PROVEN_UNREACHABLE", () => {
    const check = checkWorld(observatoryKeyBehindDoor);
    expect(check.structural).toEqual([]);
    expect(check.solvability?.status).toBe("PROVEN_UNREACHABLE");
    expect(check.solvability?.findings[0]?.code).toBe("CIRCULAR_DEPENDENCY");
  });

  it("reports the observatory as SOLVABLE with its explored states", () => {
    const check = checkWorld(observatory);
    expect(check.solvability?.status).toBe("SOLVABLE");
    expect(check.solvability?.exploredStates).toBeGreaterThan(0);
  });
});
