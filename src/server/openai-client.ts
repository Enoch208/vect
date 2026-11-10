import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ServerEnv } from "./env.js";
import { HttpFailure } from "./http.js";
import type { ModelClient } from "./model-client.js";

export function openAiModelClient(env: ServerEnv): ModelClient | null {
  if (env.OPENAI_API_KEY === undefined) return null;
  const apiKey = env.OPENAI_API_KEY;
  const model = env.OPENAI_MODEL;
  const client = new OpenAI({ apiKey, maxRetries: 0 });
  return {
    async complete(request) {
      let response;
      try {
        response = await client.responses.create(
          {
            model,
            instructions: request.instructions,
            input: request.input,
            reasoning: { effort: "low" },
            text: { format: zodTextFormat(request.schema, request.schemaName) },
            max_output_tokens: request.maxOutputTokens,
            store: false,
          },
          {
            signal: AbortSignal.timeout(request.timeoutMs),
            timeout: request.timeoutMs,
            maxRetries: 0,
          },
        );
      } catch (error) {
        throw providerFailure(error);
      }
      if (declined(response)) {
        throw new HttpFailure(
          400,
          "GENERATION_UNSUPPORTED",
          false,
          null,
          "The model declined this request.",
        );
      }
      if (response.status !== "completed") {
        const reason = response.incomplete_details?.reason ?? response.status ?? "no status";
        throw new HttpFailure(
          502,
          "PROVIDER_INVALID",
          false,
          null,
          `The model stopped with ${reason}.`,
        );
      }
      const parsed = request.schema.safeParse(jsonAnswer(outputText(response)));
      if (!parsed.success) {
        throw new HttpFailure(
          502,
          "PROVIDER_INVALID",
          false,
          null,
          "The model answer did not match the schema.",
        );
      }
      return { value: parsed.data, modelId: response.model };
    },
  };
}

function declined(response: OpenAI.Responses.Response): boolean {
  const refused = response.output.some(
    (item) => item.type === "message" && item.content.some((part) => part.type === "refusal"),
  );
  return refused || response.incomplete_details?.reason === "content_filter";
}

function outputText(response: OpenAI.Responses.Response): string {
  return response.output
    .flatMap((item) => (item.type === "message" ? item.content : []))
    .flatMap((part) => (part.type === "output_text" ? [part.text] : []))
    .join("");
}

function jsonAnswer(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new HttpFailure(502, "PROVIDER_INVALID", false, null, "The model answer was not JSON.");
    }
    throw error;
  }
}

function providerFailure(error: unknown): HttpFailure {
  if (isTimeout(error)) {
    return new HttpFailure(
      504,
      "PROVIDER_TIMEOUT",
      true,
      "Retry.",
      "The model did not answer in time.",
    );
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new HttpFailure(
      503,
      "PROVIDER_UNAVAILABLE",
      true,
      "Retry.",
      "The model provider is unreachable.",
    );
  }
  if (error instanceof OpenAI.APIError) {
    return failureForStatus(statusCode(error));
  }
  if (error instanceof Error) throw error;
  throw new Error("The model call failed.");
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof OpenAI.APIConnectionTimeoutError ||
    error instanceof OpenAI.APIUserAbortError ||
    (error instanceof Error && error.name === "TimeoutError")
  );
}

function statusCode(error: object): number | undefined {
  if (!("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

function failureForStatus(status: number | undefined): HttpFailure {
  if (status === 429) {
    return new HttpFailure(
      429,
      "RATE_LIMITED",
      true,
      "Wait and retry.",
      "The model provider rate limit was reached.",
    );
  }
  if (status === 408 || status === 504) {
    return new HttpFailure(
      504,
      "PROVIDER_TIMEOUT",
      true,
      "Retry.",
      "The model did not answer in time.",
    );
  }
  if (status !== undefined && status >= 500) {
    return new HttpFailure(
      503,
      "PROVIDER_UNAVAILABLE",
      true,
      "Retry.",
      "The model provider failed.",
    );
  }
  return new HttpFailure(
    502,
    "PROVIDER_INVALID",
    false,
    null,
    "The model provider rejected the request.",
  );
}
