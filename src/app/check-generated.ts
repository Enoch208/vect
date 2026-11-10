import type { GenerateResponse } from "../contract/api.schema.js";
import { worldRevisionHash } from "../domain/canonical.js";
import type { ApiResult } from "../store/api-client.js";
import type { WorldVersion } from "../store/types.js";
import { checkWorld } from "../verification/check-world.js";
import { makeVersion } from "./versions.js";

export function checkGenerated(response: GenerateResponse): ApiResult<WorldVersion> {
  if (
    worldRevisionHash(response.world) !== response.revisionHash ||
    response.mode !== response.world.generationMode
  ) {
    return {
      ok: false,
      failure: {
        code: "BAD_RESPONSE",
        message: "The world does not match the service's revision or origin. Retry generation.",
        retryable: true,
        suggestion: null,
        status: 200,
      },
    };
  }
  const checked = checkWorld(response.world);
  if (checked.structural.length > 0 || checked.solvability?.status !== "SOLVABLE") {
    return {
      ok: false,
      failure: {
        code: "GENERATION_INVALID",
        message:
          checked.structural[0]?.explanation ??
          checked.solvability?.findings[0]?.explanation ??
          "This world could not be confirmed playable. Retry generation.",
        retryable: true,
        suggestion: null,
        status: 200,
      },
    };
  }
  return {
    ok: true,
    data: makeVersion(
      response.world,
      response.mode === "sample_fixture" ? "example" : "generated",
      response.mode,
      response.modelId,
    ),
  };
}
