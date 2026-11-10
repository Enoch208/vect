import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as generate } from "../../api/worlds/generate.js";
import { POST as edit } from "../../api/worlds/edit.js";
import { POST as repair } from "../../api/worlds/repair.js";
import { apiErrorSchema } from "../../src/contract/api.schema.js";
import { observatory } from "../../src/fixtures/observatory.js";

const request = (body: string) =>
  new Request("http://localhost/api/worlds/generate", { method: "POST", body });
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("API routes", () => {
  it("returns the contract error envelope for malformed and oversized requests", async () => {
    for (const handle of [generate, edit, repair]) {
      for (const body of ["invalid-json", "{}", "x".repeat(300 * 1024)]) {
        const response = await handle(request(body));
        expect(response.status).toBe(400);
        expect(apiErrorSchema.parse(await response.json()).error.code).toBe("INVALID_REQUEST");
      }
    }
  });
  it("explains missing configuration instead of returning an example", async () => {
    vi.stubEnv("OPENAI_API_KEY", undefined);
    const response = await generate(
      request(
        JSON.stringify({
          prompt: "Build a locked observatory",
          theme: null,
          difficulty: null,
          clientRequestId: "ec76b1bc-b91b-481b-aa55-3591def692fa",
        }),
      ),
    );
    expect(response.status).toBe(503);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("MODEL_NOT_CONFIGURED");
  });
  it("treats an empty key in the environment template as unconfigured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await generate(
      request(
        JSON.stringify({
          prompt: "Build a locked observatory",
          theme: null,
          difficulty: null,
          clientRequestId: "ec76b1bc-b91b-481b-aa55-3591def692fa",
        }),
      ),
    );
    expect(response.status).toBe(503);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("MODEL_NOT_CONFIGURED");
  });
  it("rejects stale edit requests before contacting a provider", async () => {
    vi.stubEnv("OPENAI_API_KEY", undefined);
    const response = await edit(
      request(
        JSON.stringify({
          world: observatory,
          baseRevisionHash: "stale",
          instruction: "Move the access key",
          selectedEntityIds: [],
        }),
      ),
    );
    expect(response.status).toBe(400);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("STALE_REVISION");
  });
});
