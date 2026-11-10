import type { EditResponse, SolvabilitySummary } from "../contract/api.schema.js";
import { applyPatch } from "../domain/apply-patch.js";
import { worldRevisionHash } from "../domain/canonical.js";
import type { ApiResult } from "../store/api-client.js";
import type { WorldVersion } from "../store/types.js";
import { checkWorld } from "../verification/check-world.js";
import { makeVersion } from "./versions.js";

export type EditPreview = {
  version: WorldVersion;
  solvability: SolvabilitySummary | null;
  warnings: string[];
};

export function checkEditResponse(
  base: WorldVersion,
  instruction: string,
  response: EditResponse,
): ApiResult<EditPreview> {
  if (
    response.baseRevisionHash !== base.revisionHash ||
    response.patch.baseRevisionHash !== base.revisionHash
  ) {
    return {
      ok: false,
      failure: {
        code: "STALE_REVISION",
        message:
          "This edit was proposed for another revision. Request it again for the current world.",
        retryable: true,
        suggestion: null,
        status: 200,
      },
    };
  }
  const applied = applyPatch(base.world, response.patch);
  if (
    !applied.ok ||
    applied.revisionHash !== response.candidateRevisionHash ||
    applied.revisionHash !== worldRevisionHash(response.candidate)
  ) {
    return {
      ok: false,
      failure: {
        code: "BAD_RESPONSE",
        message: "The candidate does not match the proposed patch. Request the edit again.",
        retryable: true,
        suggestion: null,
        status: 200,
      },
    };
  }
  const checked = checkWorld(applied.candidate);
  return {
    ok: true,
    data: {
      version: {
        ...makeVersion(applied.candidate, "edited", response.mode, response.modelId),
        parentHash: base.revisionHash,
        patch: response.patch,
        instruction,
      },
      solvability: checked.solvability,
      warnings: [...response.warnings, ...checked.structural.map((finding) => finding.explanation)],
    },
  };
}
