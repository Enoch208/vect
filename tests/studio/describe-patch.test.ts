import { describe, expect, it } from "vitest";
import { describePatch } from "../../src/components/studio/describe-patch.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatory } from "../../src/fixtures/observatory.js";

describe("patch descriptions", () => {
  it("describes a key move with labels", () => {
    expect(
      describePatch(
        {
          baseRevisionHash: worldRevisionHash(observatory),
          intent: "Move the key",
          operations: [
            { op: "moveEntity", entityId: "key1", toRoomId: "control", localPosition: null },
          ],
        },
        observatory,
      ),
    ).toEqual(["Move Access Key from Library to Control Room"]);
  });

  it("describes setConnectionPredicate in words", () => {
    expect(
      describePatch(
        {
          baseRevisionHash: worldRevisionHash(observatory),
          intent: "Change the door requirement",
          operations: [
            {
              op: "setConnectionPredicate",
              connectionId: "c2",
              doorId: "door1",
              predicate: { op: "flag", flagId: "portal-enabled", value: true },
            },
          ],
        },
        observatory,
      ),
    ).toEqual(["Require Portal Switch turned on between Library and Control Room"]);
  });
});
