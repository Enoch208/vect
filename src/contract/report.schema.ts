import { z } from "zod";
import { agentModes, eventCodes, failureCodes, testStatuses } from "./codes.js";
import { idSchema } from "./expr.schema.js";
import { gameActionSchema } from "./game.schema.js";
import { reportVersion } from "./versions.js";

export const findingSchema = z.strictObject({
  code: z.enum(failureCodes),
  entityIds: z.array(idSchema),
  explanation: z.string().max(400),
});
export type Finding = z.infer<typeof findingSchema>;

export const assertionSchema = z.strictObject({
  id: z.string().max(80),
  passed: z.boolean(),
  evidenceStep: z.int().min(0).nullable(),
});
export type Assertion = z.infer<typeof assertionSchema>;

export const traceStepSchema = z.strictObject({
  index: z.int().min(0),
  action: gameActionSchema,
  accepted: z.boolean(),
  eventCode: z.enum(eventCodes),
  stateHashBefore: z.string(),
  stateHashAfter: z.string(),
});
export type TraceStep = z.infer<typeof traceStepSchema>;

export const verificationReportBodySchema = z.strictObject({
  reportVersion: z.literal(reportVersion),
  reportId: z.string(),
  createdAt: z.iso.datetime(),
  worldId: idSchema,
  worldRevisionHash: z.string(),
  initialSeed: z.int(),
  engineVersion: z.string(),
  verifierVersion: z.string(),
  agentMode: z.enum(agentModes),
  status: z.enum(testStatuses),
  assertions: z.array(assertionSchema),
  findings: z.array(findingSchema),
  trace: z.array(traceStepSchema),
  exploredStates: z.int().min(0).nullable(),
  elapsedMs: z.number().min(0),
  failureReason: z.string().nullable(),
  replayPass: z.boolean(),
});
export type VerificationReportBody = z.infer<typeof verificationReportBodySchema>;

export const verificationReportSchema = verificationReportBodySchema.extend({
  reportDigest: z.string(),
});
export type VerificationReport = z.infer<typeof verificationReportSchema>;
