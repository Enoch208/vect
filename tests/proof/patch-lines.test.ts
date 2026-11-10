import { describe, expect, it } from "vitest";
import type { PatchOperation } from "../../src/contract/patch.schema.js";
import { patchLines } from "../../src/components/proof/patch-lines.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { connection, entity, flag, hasItem } from "../../src/fixtures/build.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";

function lines(operations: PatchOperation[], world = observatoryKeyBehindDoor): string[] {
  return patchLines(
    { baseRevisionHash: worldRevisionHash(world), intent: "test", operations },
    world,
  );
}

describe("patchLines", () => {
  it("describes a key moved out from behind its door with labels", () => {
    expect(
      lines([{ op: "moveEntity", entityId: "key1", toRoomId: "library", localPosition: null }]),
    ).toEqual(["Move Access Key from Control Room to Library"]);
  });

  it("describes a new connection and a restored item", () => {
    expect(
      lines(
        [
          { op: "addConnection", connection: connection("c9", "control", "portal") },
          {
            op: "addEntity",
            entity: entity({ id: "k2", kind: "key", label: "Spare Key", roomId: "library" }),
          },
        ],
        observatory,
      ),
    ).toEqual(["Connect Control Room and Portal Chamber", "Add Spare Key in Library"]);
  });

  it("describes conditions in words, using the labels of what provides them", () => {
    expect(
      lines(
        [
          {
            op: "setConnectionPredicate",
            connectionId: "c3",
            predicate: { op: "all", of: [hasItem("key1"), flag("portal-enabled")] },
            doorId: "gate1",
          },
          { op: "setGoalPredicate", predicate: { op: "true" } },
        ],
        observatory,
      ),
    ).toEqual([
      "Require Access Key and Portal Switch switched on between Control Room and Portal Chamber",
      "Set the goal to need nothing",
    ]);
  });
});
