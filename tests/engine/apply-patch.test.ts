import { describe, expect, it } from "vitest";
import type { PatchOperation, WorldPatch } from "../../src/contract/patch.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { applyPatch } from "../../src/domain/apply-patch.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { entity } from "../../src/fixtures/build.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";

function patchOf(world: WorldSpec, operations: PatchOperation[]): WorldPatch {
  return { baseRevisionHash: worldRevisionHash(world), intent: "test edit", operations };
}

function room(id: string, x: number) {
  return { id, label: `Room ${id}`, grid: { x, z: 5 }, prefab: "small" as const };
}

describe("applyPatch", () => {
  it("turns the observatory into its key-behind-door twin", () => {
    const result = applyPatch(
      observatory,
      patchOf(observatory, [
        { op: "moveEntity", entityId: "key1", toRoomId: "control", localPosition: null },
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candidate).toEqual(observatoryKeyBehindDoor);
    expect(result.revisionHash).toBe(worldRevisionHash(observatoryKeyBehindDoor));
  });

  it("refuses a stale base hash", () => {
    const result = applyPatch(observatory, {
      baseRevisionHash: "stale",
      intent: "move key",
      operations: [{ op: "setTheme", theme: "temple" }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.operationIndex).toBeNull();
    expect(result.reason).toContain("STALE_REVISION");
  });

  it("names the failing operation and leaves the input untouched", () => {
    const before = structuredClone(observatory);
    const result = applyPatch(
      observatory,
      patchOf(observatory, [
        { op: "setTheme", theme: "temple" },
        { op: "moveEntity", entityId: "ghost", toRoomId: "library", localPosition: null },
      ]),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.operationIndex).toBe(1);
    expect(result.reason).toContain("ghost");
    expect(observatory).toEqual(before);
  });

  it("rejects an id collision", () => {
    const duplicate = entity({ id: "key1", kind: "key", label: "Spare", roomId: "entrance" });
    const result = applyPatch(
      observatory,
      patchOf(observatory, [{ op: "addEntity", entity: duplicate }]),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.operationIndex).toBe(0);
  });

  it("applies operations in order", () => {
    const lamp = entity({ id: "lamp", kind: "prop", label: "Lamp", roomId: "entrance" });
    const result = applyPatch(
      observatory,
      patchOf(observatory, [
        { op: "addEntity", entity: lamp },
        { op: "moveEntity", entityId: "lamp", toRoomId: "library", localPosition: null },
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candidate.entities.find((item) => item.id === "lamp")?.roomId).toBe("library");
    expect(result.candidate.revision).toBe(observatory.revision + 1);
  });

  it("re-parses the candidate", () => {
    const rooms: PatchOperation[] = ["r5", "r6", "r7", "r8", "r9", "r10", "r11"].map((id, i) => ({
      op: "addRoom",
      room: room(id, i - 3),
    }));
    const result = applyPatch(observatory, patchOf(observatory, rooms));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("clears a connection's door reference when the door entity is removed", () => {
    const result = applyPatch(
      observatory,
      patchOf(observatory, [{ op: "removeEntity", entityId: "door1" }]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const c2 = result.candidate.connections.find((item) => item.id === "c2");
    expect(c2?.doorId).toBeNull();
    expect(c2?.traversableWhen).toEqual({ op: "hasItem", itemId: "key1" });
  });

  it("refuses to remove a connection that a blocker still names", () => {
    const rubble = entity({
      id: "rubble",
      kind: "barrier",
      label: "Rubble",
      roomId: "entrance",
      blocksConnectionId: "c1",
    });
    const withRubble = applyPatch(
      observatory,
      patchOf(observatory, [{ op: "addEntity", entity: rubble }]),
    );
    expect(withRubble.ok).toBe(true);
    if (!withRubble.ok) return;
    const result = applyPatch(
      withRubble.candidate,
      patchOf(withRubble.candidate, [{ op: "removeConnection", connectionId: "c1" }]),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("Rubble");
  });

  it("refuses an entity placed in a room that does not exist", () => {
    const stray = entity({ id: "stray", kind: "prop", label: "Stray", roomId: "attic" });
    const result = applyPatch(
      observatory,
      patchOf(observatory, [{ op: "addEntity", entity: stray }]),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("attic");
  });
});
