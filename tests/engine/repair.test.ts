import { describe, expect, it } from "vitest";
import { repairAllowedOperations, type PatchOperation } from "../../src/contract/patch.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { proposeRuleRepair } from "../../src/agents/rule-repair.js";
import { applyPatch } from "../../src/domain/apply-patch.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { entity } from "../../src/fixtures/build.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { disconnectedGoal } from "../../src/fixtures/suite-gameplay.js";
import { repairFixtures } from "../../src/fixtures/suite-repair.js";
import { intentViolations } from "../../src/verification/intent.js";
import { verifyWorld } from "../../src/verification/verify.js";

const options = { seed: 11, now: () => 0, isoNow: () => "2026-11-10T21:00:00.000Z" };
const allowed: readonly string[] = repairAllowedOperations;

function edited(world: WorldSpec, operations: PatchOperation[]): WorldSpec {
  const result = applyPatch(world, {
    baseRevisionHash: worldRevisionHash(world),
    intent: "test",
    operations,
  });
  if (!result.ok) throw new Error(result.reason);
  return result.candidate;
}

function repairAndVerify(world: WorldSpec) {
  const before = verifyWorld(world, options);
  const [finding] = before.findings;
  if (finding === undefined) throw new Error(`${world.id} has no finding`);
  const patch = proposeRuleRepair(world, finding);
  if (patch === null) throw new Error(`${world.id} got no rule repair for ${finding.code}`);
  const applied = applyPatch(world, patch);
  if (!applied.ok) throw new Error(`${world.id}: ${applied.reason}`);
  const after = verifyWorld(applied.candidate, options);
  return { before, finding, patch, candidate: applied.candidate, after };
}

describe("intentViolations", () => {
  it("accepts moving a key", () => {
    const moved = edited(observatoryKeyBehindDoor, [
      { op: "moveEntity", entityId: "key1", toRoomId: "library", localPosition: null },
    ]);
    expect(intentViolations(observatoryKeyBehindDoor, moved)).toEqual([]);
  });

  it("R-03 deleting the goal is intent-breaking", () => {
    const goalless = edited(observatory, [{ op: "removeEntity", entityId: "goal1" }]);
    expect(intentViolations(observatory, goalless).length).toBeGreaterThan(0);
  });

  it("R-03 setGoalPredicate true is intent-breaking", () => {
    const trivial = edited(observatory, [{ op: "setGoalPredicate", predicate: { op: "true" } }]);
    expect(intentViolations(observatory, trivial).length).toBeGreaterThan(0);
  });

  it("opening a locked door for free is intent-breaking", () => {
    const open = edited(observatory, [
      {
        op: "setConnectionPredicate",
        connectionId: "c2",
        predicate: { op: "true" },
        doorId: "door1",
      },
    ]);
    expect(intentViolations(observatory, open).length).toBeGreaterThan(0);
  });

  it("handing the player a second copy of a key is intent-breaking", () => {
    const spare = entity({
      id: "spare",
      kind: "key",
      label: "Spare Key",
      roomId: "entrance",
      grantsItemId: "key1",
    });
    const handed = edited(observatoryKeyBehindDoor, [{ op: "addEntity", entity: spare }]);
    expect(intentViolations(observatoryKeyBehindDoor, handed).length).toBeGreaterThan(0);
  });

  it("moving the start or changing the theme is intent-breaking", () => {
    expect(intentViolations(observatory, { ...observatory, startRoomId: "library" })).toHaveLength(
      1,
    );
    expect(intentViolations(observatory, { ...observatory, theme: "castle" })).toHaveLength(1);
  });
});

describe("proposeRuleRepair", () => {
  it("R-01 rule repair of the twin", () => {
    const { finding, patch, candidate, after } = repairAndVerify(observatoryKeyBehindDoor);
    expect(finding.code).toBe("CIRCULAR_DEPENDENCY");
    expect(patch.operations).toHaveLength(1);
    const [op] = patch.operations;
    expect(op?.op).toBe("moveEntity");
    if (op?.op !== "moveEntity") return;
    expect(op.entityId).toBe("key1");
    expect(["library", "entrance"]).toContain(op.toRoomId);
    expect(after.status).toBe("VERIFIED");
    expect(intentViolations(observatoryKeyBehindDoor, candidate)).toEqual([]);
    expect(after.worldRevisionHash).not.toBe(worldRevisionHash(observatoryKeyBehindDoor));
  });

  it("R-02 disconnected room repair", () => {
    const { finding, patch, after } = repairAndVerify(disconnectedGoal);
    expect(finding.code).toBe("UNREACHABLE_GOAL");
    expect(patch.operations.map((item) => item.op)).toEqual(["addConnection"]);
    expect(after.status).toBe("VERIFIED");
  });

  it("gives null for a finding it has no rule for", () => {
    expect(
      proposeRuleRepair(observatory, { code: "BLOCKED_EDGE", entityIds: ["c2"], explanation: "x" }),
    ).toBeNull();
  });

  it("leaves the broken world untouched", () => {
    const before = structuredClone(observatoryKeyBehindDoor);
    repairAndVerify(observatoryKeyBehindDoor);
    expect(observatoryKeyBehindDoor).toEqual(before);
  });
});

describe("the repair fixture suite", () => {
  it("has at least 20 distinct worlds", () => {
    expect(repairFixtures.length).toBeGreaterThanOrEqual(20);
    expect(new Set(repairFixtures.map((item) => item.id)).size).toBe(repairFixtures.length);
    expect(new Set(repairFixtures.map((item) => worldRevisionHash(item.world))).size).toBe(
      repairFixtures.length,
    );
  });

  it("every repair fixture is FAILED before and VERIFIED after its rule repair", () => {
    const outcomes = repairFixtures.map(({ id, world, finding }) => {
      const { before, finding: found, patch, candidate, after } = repairAndVerify(world);
      expect(before.status, id).toBe("FAILED");
      expect(found.code, id).toBe(finding);
      expect(
        patch.operations.every((item) => allowed.includes(item.op)),
        id,
      ).toBe(true);
      expect(intentViolations(world, candidate), id).toEqual([]);
      expect(after.status, id).toBe("VERIFIED");
      return after.status;
    });
    expect(outcomes.filter((status) => status === "VERIFIED")).toHaveLength(repairFixtures.length);
  });
});
