import { describe, expect, it } from "vitest";
import {
  describeEntity,
  describeExpr,
  describeGoal,
} from "../../src/components/studio/describe.js";
import { observatory } from "../../src/fixtures/observatory.js";

describe("plain gameplay descriptions", () => {
  it("describes the observatory goal with room and switch labels", () => {
    expect(describeGoal(observatory)).toBe("Reach Portal Chamber with Portal Switch turned on");
  });

  it("joins item and flag prerequisites with and", () => {
    expect(
      describeExpr(
        {
          op: "all",
          of: [
            { op: "hasItem", itemId: "key1" },
            { op: "flag", flagId: "portal-enabled", value: true },
          ],
        },
        observatory,
      ),
    ).toBe("Access Key in your inventory and Portal Switch turned on");
  });

  it("keeps alternative and combined requirements unambiguous", () => {
    expect(
      describeExpr(
        {
          op: "all",
          of: [
            {
              op: "any",
              of: [
                { op: "hasItem", itemId: "key1" },
                { op: "flag", flagId: "portal-enabled", value: false },
              ],
            },
            { op: "true" },
          ],
        },
        observatory,
      ),
    ).toBe("(Access Key in your inventory or Portal Switch turned off) and no prerequisites");
  });

  it("explains what an entity grants", () => {
    const key = observatory.entities.find((entity) => entity.id === "key1");
    expect(key).toBeDefined();
    if (!key) throw new Error("The observatory key is missing");
    expect(describeEntity(key, observatory)).toContain("Gives Access Key");
    expect(describeEntity(key, observatory)).toContain("In Library");
  });
});
