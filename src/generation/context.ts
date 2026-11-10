import type { WorldSpec } from "../contract/world.schema.js";
import { worldRevisionHash } from "../domain/canonical.js";
import { HttpFailure } from "../server/http.js";
import type { ModelClient } from "../server/model-client.js";

export type GenerationContext = {
  model: ModelClient | null;
  requestId: string;
  timeoutMs: number;
  now: () => number;
  isoNow: () => string;
};

export function requireModel(model: ModelClient | null): ModelClient {
  if (model === null)
    throw new HttpFailure(
      503,
      "MODEL_NOT_CONFIGURED",
      false,
      "Open the example world",
      "Live generation is unavailable. You can still play the example world.",
    );
  return model;
}

export function checkRevision(world: WorldSpec, hash: string): void {
  if (worldRevisionHash(world) !== hash)
    throw new HttpFailure(
      400,
      "STALE_REVISION",
      false,
      "Return to the current version and try again.",
      "This request belongs to a different world revision.",
    );
}

export function invalidGeneration(reason: string): HttpFailure {
  return new HttpFailure(
    422,
    "GENERATION_INVALID",
    true,
    "Try a simpler request or open the example world.",
    reason,
  );
}
