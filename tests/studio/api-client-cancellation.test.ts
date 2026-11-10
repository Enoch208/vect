import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../src/store/api-client.js";
import { deferred, generateRequest, generateResponse } from "./api-fixtures.js";

describe("API request cancellation", () => {
  it("a second generate aborts the first", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          }),
      )
      .mockResolvedValueOnce(Response.json(generateResponse));
    const client = createApiClient(fetchImpl);
    const first = client.generate(generateRequest);
    const second = client.generate(generateRequest);

    expect(fetchImpl.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(await first).toMatchObject({
      ok: false,
      failure: { code: "ABORTED", retryable: false },
    });
    expect(await second).toEqual({ ok: true, data: generateResponse });
  });

  it("a superseded response cannot return data even if fetch ignores abort", async () => {
    const old = deferred<Response>();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(Response.json(generateResponse));
    const client = createApiClient(fetchImpl);
    const first = client.generate(generateRequest);
    const second = client.generate(generateRequest);
    old.resolve(Response.json(generateResponse));

    expect(await first).toMatchObject({ ok: false, failure: { code: "ABORTED" } });
    expect(await second).toEqual({ ok: true, data: generateResponse });
  });

  it("cancels a request while its body is being read", async () => {
    const oldBody = deferred<string>();
    const oldResponse = new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode(await oldBody.promise));
          controller.close();
        },
      }),
    );
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(oldResponse)
      .mockResolvedValueOnce(Response.json(generateResponse));
    const client = createApiClient(fetchImpl);
    const first = client.generate(generateRequest);
    await Promise.resolve();
    const second = client.generate(generateRequest);
    oldBody.resolve(JSON.stringify(generateResponse));

    expect(await first).toMatchObject({ ok: false, failure: { code: "ABORTED" } });
    expect(await second).toEqual({ ok: true, data: generateResponse });
  });

  it("health requests do not cancel generation", async () => {
    const old = deferred<Response>();
    const health = { status: "ok", modelConfigured: false, modelId: null, buildSha: "test" };
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(Response.json(health));
    const client = createApiClient(fetchImpl);
    const generation = client.generate(generateRequest);
    expect(await client.health()).toEqual({ ok: true, data: health });
    expect(fetchImpl.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    old.resolve(Response.json(generateResponse));
    expect(await generation).toEqual({ ok: true, data: generateResponse });
  });

  it("a cancelled call cannot clear the newer call's cancellation handle", async () => {
    const firstResponse = deferred<Response>();
    const secondResponse = deferred<Response>();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(firstResponse.promise)
      .mockReturnValueOnce(secondResponse.promise)
      .mockResolvedValueOnce(Response.json(generateResponse));
    const client = createApiClient(fetchImpl);
    const first = client.generate(generateRequest);
    const second = client.generate(generateRequest);
    firstResponse.resolve(Response.json(generateResponse));
    await first;
    const third = client.generate(generateRequest);

    expect(fetchImpl.mock.calls[1]?.[1]?.signal?.aborted).toBe(true);
    secondResponse.resolve(Response.json(generateResponse));
    expect(await second).toMatchObject({ ok: false, failure: { code: "ABORTED" } });
    expect(await third).toEqual({ ok: true, data: generateResponse });
  });
});
