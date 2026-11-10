import { describe, expect, it } from "vitest";
import { exprSchema, type Expr } from "../../src/contract/expr.schema.js";
import { worldPatchSchema } from "../../src/contract/patch.schema.js";
import { worldSpecSchema } from "../../src/contract/world.schema.js";
import { canonicalJson } from "../../src/domain/canonical.js";
import { observatory } from "../../src/fixtures/observatory.js";

function nested(depth: number): Expr {
  return depth === 1 ? { op: "true" } : { op: "all", of: [nested(depth - 1)] };
}

describe("the world contract", () => {
  it("rejects unknown properties, so a model cannot smuggle a script field", () => {
    const withScript = { ...observatory, onLoad: "fetch('https://evil.example')" };
    expect(worldSpecSchema.safeParse(withScript).success).toBe(false);
  });

  it("rejects entity kinds outside the grammar", () => {
    const dragon = {
      ...observatory,
      entities: [...observatory.entities, { ...observatory.entities[0], id: "x", kind: "dragon" }],
    };
    expect(worldSpecSchema.safeParse(dragon).success).toBe(false);
  });

  it("bounds expression depth at five", () => {
    expect(exprSchema.safeParse(nested(5)).success).toBe(true);
    expect(exprSchema.safeParse(nested(6)).success).toBe(false);
  });

  it("accepts only allowlisted patch operations", () => {
    const patch = (operations: unknown[]) => ({ baseRevisionHash: "h", intent: "fix", operations });
    expect(worldPatchSchema.safeParse(patch([{ op: "setTheme", theme: "temple" }])).success).toBe(
      true,
    );
    expect(worldPatchSchema.safeParse(patch([{ op: "setWon", value: true }])).success).toBe(false);
    expect(worldPatchSchema.safeParse(patch([])).success).toBe(false);
  });
});

describe("canonical JSON", () => {
  it("ignores key order", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      canonicalJson({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });

  it("rejects non-finite numbers", () => {
    expect(() => canonicalJson({ x: Number.NaN })).toThrow(TypeError);
  });
});
