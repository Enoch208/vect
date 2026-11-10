import { z } from "zod";
import { themes } from "./codes.js";
import { exprSchema, idSchema } from "./expr.schema.js";
import { worldLimits } from "./limits.js";
import { connectionSchema, entitySchema, localPositionSchema, roomSchema } from "./world.schema.js";

export const patchOperationSchema = z.discriminatedUnion("op", [
  z.strictObject({ op: z.literal("addRoom"), room: roomSchema }),
  z.strictObject({ op: z.literal("addEntity"), entity: entitySchema }),
  z.strictObject({
    op: z.literal("moveEntity"),
    entityId: idSchema,
    toRoomId: idSchema,
    localPosition: localPositionSchema.nullable(),
  }),
  z.strictObject({ op: z.literal("removeEntity"), entityId: idSchema }),
  z.strictObject({ op: z.literal("addConnection"), connection: connectionSchema }),
  z.strictObject({ op: z.literal("removeConnection"), connectionId: idSchema }),
  z.strictObject({
    op: z.literal("setConnectionPredicate"),
    connectionId: idSchema,
    predicate: exprSchema,
    doorId: idSchema.nullable(),
  }),
  z.strictObject({
    op: z.literal("setEntityRequirement"),
    entityId: idSchema,
    requires: exprSchema,
  }),
  z.strictObject({ op: z.literal("setGoalPredicate"), predicate: exprSchema }),
  z.strictObject({ op: z.literal("setTheme"), theme: z.enum(themes) }),
]);
export type PatchOperation = z.infer<typeof patchOperationSchema>;
export type PatchOperationName = PatchOperation["op"];

export const worldPatchSchema = z.strictObject({
  baseRevisionHash: z.string(),
  intent: z.string().trim().min(1).max(200),
  operations: z.array(patchOperationSchema).min(1).max(worldLimits.patchOperations),
});
export type WorldPatch = z.infer<typeof worldPatchSchema>;

export const repairAllowedOperations = [
  "moveEntity",
  "addConnection",
  "setConnectionPredicate",
  "setEntityRequirement",
  "addEntity",
] as const satisfies readonly PatchOperationName[];
