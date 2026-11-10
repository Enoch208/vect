import type { ZodType } from "zod";

export interface ModelClient {
  complete<T>(request: {
    schema: ZodType<T>;
    schemaName: string;
    instructions: string;
    input: string;
    maxOutputTokens: number;
    timeoutMs: number;
  }): Promise<{ value: T; modelId: string }>;
}
