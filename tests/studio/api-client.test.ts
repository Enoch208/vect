import { describe, expect, it, vi } from "vitest";
import { apiRoutes } from "../../src/contract/api.schema.js";
import { observatory } from "../../src/fixtures/observatory.js";
import { createApiClient } from "../../src/store/api-client.js";
import { generateRequest, generateResponse } from "./api-fixtures.js";

describe("the API client", () => {
  it("parses a 200 generate response", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json(generateResponse));
    const result = await createApiClient(fetchImpl).generate(generateRequest);

    expect(result).toEqual({ ok: true, data: generateResponse });
    expect(fetchImpl).toHaveBeenCalledWith(
      apiRoutes.generate,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(generateRequest),
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      }),
    );
    expect(fetchImpl.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("maps a 503 envelope to its code and suggestion", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          error: {
            code: "MODEL_NOT_CONFIGURED",
            message: "Generation is not configured.",
            retryable: false,
            suggestion: "Open the example world.",
            requestId: "client-test-error",
          },
        },
        { status: 503 },
      ),
    );

    expect(await createApiClient(fetchImpl).generate(generateRequest)).toEqual({
      ok: false,
      failure: {
        code: "MODEL_NOT_CONFIGURED",
        message: "Generation is not configured.",
        retryable: false,
        suggestion: "Open the example world.",
        status: 503,
      },
    });
  });

  it.each([200, 503])(
    "a body that fails the schema is BAD_RESPONSE at %i, never data",
    async (status) => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ status: "VERIFIED" }, { status }));
      const result = await createApiClient(fetchImpl).generate(generateRequest);

      expect(result).toMatchObject({ ok: false, failure: { code: "BAD_RESPONSE", status } });
      expect(result).not.toHaveProperty("data");
    },
  );

  it("malformed JSON is BAD_RESPONSE", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("<html>Unavailable</html>"));
    expect(await createApiClient(fetchImpl).generate(generateRequest)).toMatchObject({
      ok: false,
      failure: { code: "BAD_RESPONSE", status: 200 },
    });
  });

  it("network error is NETWORK retryable", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await createApiClient(fetchImpl).generate(generateRequest)).toMatchObject({
      ok: false,
      failure: { code: "NETWORK", retryable: true, status: null },
    });
  });

  it("validates and normalizes requests before sending them", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json(generateResponse));
    const client = createApiClient(fetchImpl);
    expect(await client.generate({ ...generateRequest, prompt: "short" })).toMatchObject({
      ok: false,
      failure: { code: "INVALID_REQUEST", retryable: false, status: null },
    });
    expect(fetchImpl).not.toHaveBeenCalled();

    await client.generate({ ...generateRequest, prompt: `  ${generateRequest.prompt}  ` });
    expect(fetchImpl).toHaveBeenCalledWith(
      apiRoutes.generate,
      expect.objectContaining({ body: JSON.stringify(generateRequest) }),
    );
  });

  it("parses health with a GET request", async () => {
    const health = { status: "ok", modelConfigured: false, modelId: null, buildSha: "test" };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json(health));

    expect(await createApiClient(fetchImpl).health()).toEqual({ ok: true, data: health });
    expect(fetchImpl).toHaveBeenCalledWith(
      apiRoutes.health,
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchImpl.mock.calls[0]?.[1]).not.toHaveProperty("body");
  });

  it("validates edit and repair response schemas independently", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(Response.json(generateResponse)));
    const client = createApiClient(fetchImpl);
    const base = { world: observatory, baseRevisionHash: generateResponse.revisionHash };
    expect(
      await client.edit({
        ...base,
        instruction: "Move the key to the entrance.",
        selectedEntityIds: ["key1"],
      }),
    ).toMatchObject({
      ok: false,
      failure: { code: "BAD_RESPONSE" },
    });
    expect(
      await client.repair({
        ...base,
        finding: {
          code: "CIRCULAR_DEPENDENCY",
          entityIds: ["key1", "door1"],
          explanation: "Test finding",
        },
        maxAttempts: 3,
      }),
    ).toMatchObject({
      ok: false,
      failure: { code: "BAD_RESPONSE" },
    });
    expect(fetchImpl.mock.calls.map(([route]) => route)).toEqual([
      apiRoutes.edit,
      apiRoutes.repair,
    ]);
  });
});
