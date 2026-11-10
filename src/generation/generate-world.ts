import {
  generateResponseSchema,
  type GenerateRequest,
  type GenerateResponse,
} from "../contract/api.schema.js";
import { worldRevisionHash } from "../domain/canonical.js";
import { createInitialState } from "../domain/step-game.js";
import { HttpFailure } from "../server/http.js";
import { checkWorld } from "../verification/check-world.js";
import { invalidGeneration, requireModel, type GenerationContext } from "./context.js";
import { normalizePlan, seedFor } from "./normalize.js";
import { plannerInput, plannerInstructions } from "./planner-prompt.js";
import { generationOutputSchema } from "./world-plan.schema.js";

export async function generateWorld(
  request: GenerateRequest,
  deps: GenerationContext,
): Promise<GenerateResponse> {
  const model = requireModel(deps.model);
  const started = deps.now();
  let correction: string | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await model.complete({
      schema: generationOutputSchema,
      schemaName: "world_intent",
      instructions: plannerInstructions,
      input: plannerInput(request.prompt, request.theme, request.difficulty, correction),
      maxOutputTokens: 12000,
      timeoutMs: deps.timeoutMs,
    });
    const parsed = generationOutputSchema.safeParse(result.value);
    if (!parsed.success) {
      correction = parsed.error.message;
      continue;
    }
    const output = parsed.data;
    if (!output.supported)
      throw new HttpFailure(
        400,
        "GENERATION_UNSUPPORTED",
        false,
        output.suggestion,
        output.unsupportedReason ?? "Describe a puzzle using rooms, keys, doors and switches.",
      );
    if (output.world === null) {
      correction = "A supported request must include a world.";
      continue;
    }
    const plan = request.theme === null ? output.world : { ...output.world, theme: request.theme };
    const world = normalizePlan(plan, {
      prompt: request.prompt,
      seed: seedFor(request.clientRequestId),
      createdAt: deps.isoNow(),
      modelId: result.modelId,
      adaptations: output.adaptations,
    });
    const checked = checkWorld(world);
    if (checked.solvability?.status === "SOLVABLE" && !createInitialState(world, world.seed).won)
      return generateResponseSchema.parse({
        requestId: deps.requestId,
        mode: "live_ai",
        modelId: result.modelId,
        world,
        revisionHash: worldRevisionHash(world),
        adaptations: output.adaptations,
        solvability: checked.solvability,
        durationMs: deps.now() - started,
      });
    correction =
      [...checked.structural, ...(checked.solvability?.findings ?? [])]
        .map((finding) => finding.explanation)
        .join("; ") || "The world must require gameplay and must not be won at the start.";
  }
  throw invalidGeneration(correction ?? "The world could not be made playable.");
}
