import type { ZodType } from "zod";
import type { GenerationContext } from "../generation/context.js";
import { serverEnv } from "./env.js";
import { clientIp, errorResponse, HttpFailure, newRequestId, readJsonBody } from "./http.js";
import { createLimiter, type Lease } from "./limits.js";
import { openAiModelClient } from "./openai-client.js";

let admission: { key: string; limiter: ReturnType<typeof createLimiter> } | null = null;

export function postRoute<T, R>(
  schema: ZodType<T>,
  handle: (body: T, deps: GenerationContext) => Promise<R>,
) {
  return async (request: Request): Promise<Response> => {
    const requestId = newRequestId();
    const started = Date.now();
    let lease: Lease | null = null;
    let status = 200;
    let code: string | null = null;
    try {
      const parsed = schema.safeParse(await readJsonBody(request, 256 * 1024));
      if (!parsed.success)
        throw new HttpFailure(
          400,
          "INVALID_REQUEST",
          false,
          null,
          "The request is incomplete or invalid. Check your input and try again.",
        );
      const env = serverEnv();
      const key = `${String(env.AI_RATE_LIMIT_PER_HOUR)}:${String(env.AI_MAX_CONCURRENT)}`;
      if (admission?.key !== key)
        admission = {
          key,
          limiter: createLimiter({
            perHour: env.AI_RATE_LIMIT_PER_HOUR,
            maxConcurrent: env.AI_MAX_CONCURRENT,
            now: Date.now,
          }),
        };
      lease = admission.limiter.admit(clientIp(request));
      const result = await handle(parsed.data, {
        model: openAiModelClient(env),
        requestId,
        timeoutMs: env.AI_TIMEOUT_MS,
        now: Date.now,
        isoNow: () => new Date().toISOString(),
      });
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      const failure =
        error instanceof HttpFailure
          ? error
          : new HttpFailure(
              500,
              "INTERNAL",
              true,
              "Retry or open the example world.",
              "The request could not be completed.",
            );
      status = failure.status;
      code = failure.code;
      return errorResponse(failure, requestId);
    } finally {
      lease?.release();
      process.stdout.write(
        `${JSON.stringify({ requestId, route: new URL(request.url).pathname, durationMs: Date.now() - started, status, code })}\n`,
      );
    }
  };
}
