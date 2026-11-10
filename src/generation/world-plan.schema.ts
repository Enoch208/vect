import { z } from "zod";
import { worldLimits } from "../contract/limits.js";
import { worldSpecSchema } from "../contract/world.schema.js";

export const worldPlanSchema = worldSpecSchema.omit({
  schemaVersion: true,
  id: true,
  revision: true,
  seed: true,
  generationMode: true,
  prompt: true,
  metadata: true,
});
export type WorldPlan = z.infer<typeof worldPlanSchema>;

export const generationOutputSchema = z.strictObject({
  supported: z.boolean(),
  unsupportedReason: z.string().nullable(),
  suggestion: z.string().nullable(),
  adaptations: z.array(z.string()).max(worldLimits.adaptations),
  world: worldPlanSchema.nullable(),
});
export type GenerationOutput = z.infer<typeof generationOutputSchema>;
