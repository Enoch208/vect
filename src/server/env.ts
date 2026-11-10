import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional(),
  ),
  OPENAI_MODEL: z.string().min(1).default("gpt-6.1-sol"),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60_000).default(20_000),
  AI_MAX_CONCURRENT: z.coerce.number().int().min(1).max(20).default(3),
  AI_RATE_LIMIT_PER_HOUR: z.coerce.number().int().min(1).max(1000).default(8),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function serverEnv(): ServerEnv {
  return envSchema.parse(process.env);
}
