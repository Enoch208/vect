import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Expr } from "../../../src/contract/expr.schema.js";
import type { GameAction, GameState } from "../../../src/contract/game.schema.js";
import type { Connection, WorldSpec } from "../../../src/contract/world.schema.js";
import { stateHash } from "../../../src/domain/canonical.js";
import { assertInvariants } from "../../../src/domain/invariants.js";
import { candidateActions, createInitialState, stepGame } from "../../../src/domain/step-game.js";
import { observatory, observatoryKeyBehindDoor } from "../../../src/fixtures/observatory.js";
import { backtrackingWorld, goalSeenTooEarly } from "../../../src/fixtures/suite-agent.js";
import {
  disconnectedGoal,
  duplicateKeys,
  keyBeforeDoor,
  lockWithNoUnlockPath,
  routeAroundTrap,
  switchBehindOpenRoute,
  twoLevelCycle,
  twoSequentialLocks,
} from "../../../src/fixtures/suite-gameplay.js";
import { tenRoomTemple } from "../../../src/fixtures/suite-large.js";
import { repairFixtures } from "../../../src/fixtures/suite-repair.js";
import { solve } from "../../../src/verification/solve.js";

type Choice = { pick: number } | { action: GameAction };

const playable = [
  observatory,
  keyBeforeDoor,
  switchBehindOpenRoute,
  twoSequentialLocks,
  routeAroundTrap,
  duplicateKeys,
  tenRoomTemple,
  backtrackingWorld,
  goalSeenTooEarly,
];

const impossible = [
  observatoryKeyBehindDoor,
  disconnectedGoal,
  lockWithNoUnlockPath,
  twoLevelCycle,
  ...repairFixtures.map((item) => item.world),
];

function choices(world: WorldSpec) {
  const rooms = [...world.rooms.map((item) => item.id), "nowhere"];
  const entities = [...world.entities.map((item) => item.id), "ghost"];
  const action: fc.Arbitrary<GameAction> = fc.oneof(
    fc.constantFrom(...rooms).map((roomId): GameAction => ({ type: "MOVE_TO", roomId })),
    fc.constantFrom(...entities).map((entityId): GameAction => ({ type: "INTERACT", entityId })),
    fc.constantFrom(...entities).map((entityId): GameAction => ({ type: "INSPECT", entityId })),
    fc.integer({ min: 1, max: 10 }).map((ticks): GameAction => ({ type: "WAIT", ticks })),
  );
  const choice: fc.Arbitrary<Choice> = fc.oneof(
    { weight: 3, arbitrary: fc.nat().map((pick) => ({ pick })) },
    { weight: 1, arbitrary: action.map((item) => ({ action: item })) },
  );
  return fc.array(choice, { maxLength: 40 });
}

function resolve(world: WorldSpec, state: GameState, choice: Choice): GameAction {
  if ("action" in choice) return choice.action;
  const options = candidateActions(world, state);
  return options[choice.pick % Math.max(1, options.length)] ?? { type: "WAIT", ticks: 1 };
}

function holds(expr: Expr, state: GameState): boolean {
  if (expr.op === "true") return true;
  if (expr.op === "hasItem") return state.inventory.includes(expr.itemId);
  if (expr.op === "flag") return (state.activeFlags[expr.flagId] ?? false) === expr.value;
  return expr.op === "all"
    ? expr.of.every((child) => holds(child, state))
    : expr.of.some((child) => holds(child, state));
}

function openBefore(world: WorldSpec, state: GameState, connection: Connection): boolean {
  const blockersCleared = world.entities
    .filter((item) => item.blocksConnectionId === connection.id)
    .every((item) => state.collectedEntities.includes(item.id));
  const unlocked = connection.doorId !== null && state.unlockedDoors.includes(connection.doorId);
  return blockersCleared && (unlocked || holds(connection.traversableWhen, state));
}

function linking(world: WorldSpec, a: string, b: string): Connection[] {
  return world.connections.filter(
    (item) =>
      (item.fromRoomId === a && item.toRoomId === b) ||
      (item.fromRoomId === b && item.toRoomId === a),
  );
}

function play(world: WorldSpec, picks: Choice[], seed: number) {
  let state = createInitialState(world, seed);
  for (const choice of picks) {
    const action = resolve(world, state, choice);
    const transition = stepGame(world, state, action);
    if (!transition.ok) expect(transition.state).toBe(state);
    if (transition.ok && action.type === "MOVE_TO") {
      expect(
        linking(world, state.currentRoomId, action.roomId).some((item) =>
          openBefore(world, state, item),
        ),
      ).toBe(true);
    }
    state = transition.state;
    if (state.won) {
      expect(state.currentRoomId).toBe(world.goal.roomId);
      expect(holds(world.goal.requires, state)).toBe(true);
    }
    expect(assertInvariants(world, state)).toEqual([]);
  }
  return state;
}

describe("gameplay properties", () => {
  for (const world of [...playable, ...impossible.slice(0, 4)]) {
    it(`${world.id}: refusals keep the state, moves respect gates, wins respect the goal, invariants hold`, () => {
      fc.assert(
        fc.property(choices(world), fc.integer({ min: 0, max: 1000 }), (picks, seed) => {
          play(world, picks, seed);
        }),
        { numRuns: 150 },
      );
    });
  }

  it("same seed and actions give the same final stateHash", () => {
    fc.assert(
      fc.property(choices(tenRoomTemple), fc.integer({ min: 0, max: 1000 }), (picks, seed) => {
        expect(stateHash(play(tenRoomTemple, picks, seed))).toBe(
          stateHash(play(tenRoomTemple, picks, seed)),
        );
      }),
      { numRuns: 100 },
    );
  });

  it("no play ever wins a world the solver proves impossible", () => {
    for (const world of impossible) {
      expect(solve(world).status, world.id).toBe("PROVEN_UNREACHABLE");
      fc.assert(
        fc.property(choices(world), (picks) => {
          expect(play(world, picks, world.seed).won).toBe(false);
        }),
        { numRuns: 60 },
      );
    }
  });
});
