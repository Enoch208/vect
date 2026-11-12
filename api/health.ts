import type { HealthResponse } from "../src/contract/api.schema.js";
import { serverEnv } from "../src/server/env.js";

export function GET(): Response {
  const env = serverEnv();
  const body: HealthResponse = {
    status: "ok",
    modelConfigured: env.OPENAI_API_KEY !== undefined,
    modelId: env.OPENAI_API_KEY === undefined ? null : env.OPENAI_MODEL,
    buildSha: env.VECT_BUILD_SHA ?? env.VERCEL_GIT_COMMIT_SHA ?? "local",
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
