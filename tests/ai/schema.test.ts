import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import { worldLimits } from "../../src/contract/limits.js";
import { generationOutputSchema, worldPlanSchema } from "../../src/generation/world-plan.schema.js";

function recordedPlan(): unknown {
  return JSON.parse(
    readFileSync(new URL("./fixtures/observatory-plan.json", import.meta.url), "utf8"),
  ) as unknown;
}

describe("world plan schema", () => {
  it("the plan schema converts to a strict OpenAI format", () => {
    const format = zodTextFormat(generationOutputSchema, "world_plan");
    expect(format.type).toBe("json_schema");
    expect(format.name).toBe("world_plan");
    expect(format.strict).toBe(true);
    expect(format.schema).toMatchObject({
      type: "object",
      additionalProperties: false,
    });
  });

  it("rejects a plan with more rooms than the grammar allows", () => {
    const plan = worldPlanSchema.parse(recordedPlan());
    const first = plan.rooms[0];
    if (first === undefined) throw new Error("recorded plan has no rooms");
    const rooms = [...plan.rooms];
    while (rooms.length <= worldLimits.rooms.max) {
      rooms.push({ ...first, id: `room-${String(rooms.length)}` });
    }
    expect(worldPlanSchema.safeParse({ ...plan, rooms }).success).toBe(false);
  });
});
