import { describe, expect, it } from "vitest";
import { checkGenerated } from "../../src/app/check-generated.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { generateResponse } from "./api-fixtures.js";

describe("checking a generated revision", () => {
  it("accepts the sample with honest origin and no verification report", () => {
    const result = checkGenerated(generateResponse);
    expect(result).toMatchObject({
      ok: true,
      data: { source: "example", origin: "sample_fixture" },
    });
    expect(result).not.toHaveProperty("report");
  });

  it("rejects an incorrect revision hash", () => {
    expect(checkGenerated({ ...generateResponse, revisionHash: "wrong-hash" })).toMatchObject({
      ok: false,
      failure: { code: "BAD_RESPONSE" },
    });
  });

  it("rejects a sample advertised as live AI", () => {
    expect(checkGenerated({ ...generateResponse, mode: "live_ai" })).toMatchObject({
      ok: false,
      failure: { code: "BAD_RESPONSE" },
    });
  });

  it("rejects an unsolvable world even when the service calls it solvable", () => {
    const result = checkGenerated({
      ...generateResponse,
      world: observatoryKeyBehindDoor,
      revisionHash: worldRevisionHash(observatoryKeyBehindDoor),
    });
    expect(result).toMatchObject({ ok: false, failure: { code: "GENERATION_INVALID" } });
  });
});
