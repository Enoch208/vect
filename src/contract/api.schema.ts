import { z } from "zod";
import {
  apiErrorCodes,
  difficulties,
  failureCodes,
  generationModes,
  repairModes,
  repairOutcomes,
  solvabilityStatuses,
  themes,
} from "./codes.js";
import { idSchema } from "./expr.schema.js";
import { worldLimits } from "./limits.js";
import { worldPatchSchema } from "./patch.schema.js";
import { findingSchema } from "./report.schema.js";
import { worldSpecSchema } from "./world.schema.js";

export const apiRoutes = {
  generate: "/api/worlds/generate",
  edit: "/api/worlds/edit",
  repair: "/api/worlds/repair",
  health: "/api/health",
} as const;

const promptSchema = z
  .string()
  .trim()
  .min(worldLimits.promptLength.min)
  .max(worldLimits.promptLength.max);

export const solvabilitySummarySchema = z.strictObject({
  status: z.enum(solvabilityStatuses),
  findings: z.array(findingSchema),
  exploredStates: z.int().min(0),
});
export type SolvabilitySummary = z.infer<typeof solvabilitySummarySchema>;

export const generateRequestSchema = z.strictObject({
  prompt: promptSchema,
  theme: z.enum(themes).nullable(),
  difficulty: z.enum(difficulties).nullable(),
  clientRequestId: z.uuid(),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const generateResponseSchema = z.strictObject({
  requestId: z.string(),
  mode: z.enum(generationModes),
  modelId: z.string().nullable(),
  world: worldSpecSchema,
  revisionHash: z.string(),
  adaptations: z.array(z.string()),
  solvability: solvabilitySummarySchema,
  durationMs: z.number().min(0),
});
export type GenerateResponse = z.infer<typeof generateResponseSchema>;

export const editRequestSchema = z.strictObject({
  world: worldSpecSchema,
  baseRevisionHash: z.string(),
  instruction: promptSchema,
  selectedEntityIds: z.array(idSchema).max(worldLimits.selectedEntities),
});
export type EditRequest = z.infer<typeof editRequestSchema>;

export const editResponseSchema = z.strictObject({
  requestId: z.string(),
  mode: z.enum(generationModes),
  modelId: z.string().nullable(),
  patch: worldPatchSchema,
  candidate: worldSpecSchema,
  baseRevisionHash: z.string(),
  candidateRevisionHash: z.string(),
  warnings: z.array(z.string()),
  solvability: solvabilitySummarySchema,
  durationMs: z.number().min(0),
});
export type EditResponse = z.infer<typeof editResponseSchema>;

export const repairRequestSchema = z.strictObject({
  world: worldSpecSchema,
  baseRevisionHash: z.string(),
  finding: z.strictObject({
    code: z.enum(failureCodes),
    entityIds: z.array(idSchema),
    explanation: z.string().max(400),
  }),
  maxAttempts: z.int().min(1).max(worldLimits.repairAttempts),
});
export type RepairRequest = z.infer<typeof repairRequestSchema>;

export const repairAttemptSchema = z.strictObject({
  attempt: z.int().min(1).max(worldLimits.repairAttempts),
  mode: z.enum(repairModes),
  patch: worldPatchSchema.nullable(),
  candidateRevisionHash: z.string().nullable(),
  outcome: z.enum(repairOutcomes),
  reason: z.string(),
});
export type RepairAttempt = z.infer<typeof repairAttemptSchema>;

export const repairResponseSchema = z.strictObject({
  requestId: z.string(),
  modelId: z.string().nullable(),
  baseRevisionHash: z.string(),
  attempts: z.array(repairAttemptSchema),
  candidate: worldSpecSchema.nullable(),
  candidateRevisionHash: z.string().nullable(),
  durationMs: z.number().min(0),
});
export type RepairResponse = z.infer<typeof repairResponseSchema>;

export const healthResponseSchema = z.strictObject({
  status: z.literal("ok"),
  modelConfigured: z.boolean(),
  modelId: z.string().nullable(),
  buildSha: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const apiErrorSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum(apiErrorCodes),
    message: z.string(),
    retryable: z.boolean(),
    suggestion: z.string().nullable(),
    requestId: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
