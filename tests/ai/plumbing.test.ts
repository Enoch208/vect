import { describe, expect, it } from "vitest";
import { apiErrorSchema } from "../../src/contract/api.schema.js";
import { HttpFailure, clientIp, errorResponse, readJsonBody } from "../../src/server/http.js";
import { createLimiter } from "../../src/server/limits.js";
import { openAiModelClient } from "../../src/server/openai-client.js";
import type { ServerEnv } from "../../src/server/env.js";

const limitBytes = 256 * 1024;

const configuredEnv: ServerEnv = {
  OPENAI_MODEL: "gpt-6.1-sol",
  AI_TIMEOUT_MS: 20_000,
  AI_MAX_CONCURRENT: 3,
  AI_RATE_LIMIT_PER_HOUR: 8,
};

function post(body: string, headers?: HeadersInit): Request {
  const url = "http://127.0.0.1/api/worlds/generate";
  if (headers === undefined) return new Request(url, { method: "POST", body });
  return new Request(url, { method: "POST", body, headers });
}

describe("request bodies", () => {
  it("rejects a body over the limit with 400", async () => {
    const request = post(JSON.stringify({ prompt: "a".repeat(300 * 1024) }));
    await expect(readJsonBody(request, limitBytes)).rejects.toMatchObject({
      status: 400,
      code: "INVALID_REQUEST",
      retryable: false,
      suggestion: null,
    });
  });

  it("returns parsed JSON when the body is within the limit", async () => {
    const request = post('{"prompt":"a locked observatory"}');
    await expect(readJsonBody(request, limitBytes)).resolves.toEqual({
      prompt: "a locked observatory",
    });
  });

  it("rejects a body that is not JSON with 400", async () => {
    await expect(readJsonBody(post("not-json"), limitBytes)).rejects.toMatchObject({
      status: 400,
      code: "INVALID_REQUEST",
      retryable: false,
    });
  });

  it("stops reading a stream once the byte limit is passed", async () => {
    let pulls = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls > 8) {
          controller.close();
          return;
        }
        controller.enqueue(new Uint8Array(64 * 1024));
      },
    });
    const init = {
      method: "POST",
      body: stream,
      duplex: "half",
    };
    const request = new Request("http://127.0.0.1/api/worlds/generate", init);
    await expect(readJsonBody(request, limitBytes)).rejects.toMatchObject({
      status: 400,
      code: "INVALID_REQUEST",
      retryable: false,
    });
    expect(pulls).toBeLessThanOrEqual(6);
  });
});

describe("admission limits", () => {
  it("the ninth request in an hour is 429", () => {
    const limiter = createLimiter({ perHour: 8, maxConcurrent: 20, now: () => 1_700_000_000_000 });
    for (let attempt = 0; attempt < 8; attempt += 1) {
      limiter.admit("203.0.113.8").release();
    }
    expect(() => limiter.admit("203.0.113.8")).toThrow(
      expect.objectContaining({
        status: 429,
        code: "RATE_LIMITED",
        retryable: true,
      }),
    );
  });

  it("a fourth concurrent lease is 429 and a released lease frees a slot", () => {
    const limiter = createLimiter({ perHour: 100, maxConcurrent: 3, now: () => 0 });
    const first = limiter.admit("203.0.113.1");
    limiter.admit("203.0.113.2");
    limiter.admit("203.0.113.3");
    expect(() => limiter.admit("203.0.113.4")).toThrow(
      expect.objectContaining({
        status: 429,
        code: "RATE_LIMITED",
        retryable: true,
      }),
    );
    first.release();
    expect(() => limiter.admit("203.0.113.4")).not.toThrow();
  });

  it("allows a request once earlier ones are an hour old", () => {
    let now = 0;
    const limiter = createLimiter({ perHour: 1, maxConcurrent: 5, now: () => now });
    limiter.admit("203.0.113.7").release();
    expect(() => limiter.admit("203.0.113.7")).toThrow(
      expect.objectContaining({ status: 429, code: "RATE_LIMITED" }),
    );
    now = 60 * 60 * 1000;
    expect(() => limiter.admit("203.0.113.7")).not.toThrow();
  });
});

describe("error envelope", () => {
  it("parses with apiErrorSchema", async () => {
    const failure = new HttpFailure(
      503,
      "MODEL_NOT_CONFIGURED",
      false,
      "Open the example world",
      "The model is not configured.",
    );
    const response = errorResponse(failure, "req-observatory");
    expect(response.status).toBe(503);
    expect(apiErrorSchema.parse(await response.json())).toEqual({
      error: {
        code: "MODEL_NOT_CONFIGURED",
        message: "The model is not configured.",
        retryable: false,
        suggestion: "Open the example world",
        requestId: "req-observatory",
      },
    });
  });
});

describe("model client", () => {
  it("openAiModelClient is null without a key", () => {
    expect(openAiModelClient(configuredEnv)).toBeNull();
  });
});

describe("client address", () => {
  it("uses the first forwarded hop and otherwise local", () => {
    const forwarded = post("{}", { "x-forwarded-for": "203.0.113.9, 10.0.0.4" });
    expect(clientIp(forwarded)).toBe("203.0.113.9");
    expect(clientIp(post("{}"))).toBe("local");
  });
});
