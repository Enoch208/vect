import { describe, expect, it } from "vitest";
import type { EditResponse } from "../../src/contract/api.schema.js";
import type { WorldPatch } from "../../src/contract/patch.schema.js";
import { checkEditResponse } from "../../src/app/check-edit.js";
import { makeVersion } from "../../src/app/versions.js";
import { applyPatch } from "../../src/domain/apply-patch.js";
import { observatory } from "../../src/fixtures/observatory.js";

const base = makeVersion(observatory, "example", "sample_fixture", null);
const patch: WorldPatch = {
  baseRevisionHash: base.revisionHash,
  intent: "Put the key behind its own door",
  operations: [{ op: "moveEntity", entityId: "key1", toRoomId: "control", localPosition: null }],
};
const result = applyPatch(base.world, patch);
if (!result.ok) throw new Error(result.reason);
const response: EditResponse = {
  requestId: "edit-preview-test",
  mode: "live_ai",
  modelId: "test-model",
  patch,
  candidate: result.candidate,
  baseRevisionHash: base.revisionHash,
  candidateRevisionHash: result.revisionHash,
  warnings: [],
  solvability: { status: "PROVEN_UNREACHABLE", findings: [], exploredStates: 0 },
  durationMs: 0,
};

describe("edit previews", () => {
  it("accepts a broken draft without creating a verification report", () => {
    const checked = checkEditResponse(base, patch.intent, response);
    expect(checked).toMatchObject({
      ok: true,
      data: {
        version: { source: "edited", parentHash: base.revisionHash, patch },
        solvability: { status: "PROVEN_UNREACHABLE" },
      },
    });
    expect(checked).not.toHaveProperty("report");
    expect(base.world).toEqual(observatory);
  });

  it("rejects an edit for another revision", () => {
    expect(
      checkEditResponse(base, patch.intent, { ...response, baseRevisionHash: "old-revision" }),
    ).toMatchObject({ ok: false, failure: { code: "STALE_REVISION" } });
  });

  it("rejects a candidate that does not match applying the patch", () => {
    expect(
      checkEditResponse(base, patch.intent, {
        ...response,
        candidate: { ...response.candidate, title: "Unexpected change" },
      }),
    ).toMatchObject({ ok: false, failure: { code: "BAD_RESPONSE" } });
  });
});
