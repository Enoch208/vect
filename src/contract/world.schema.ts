import { z } from "zod";
import { entityKinds, generationModes, prefabs, themes } from "./codes.js";
import { exprSchema, idSchema } from "./expr.schema.js";
import { worldLimits } from "./limits.js";
import { schemaVersion } from "./versions.js";

const gridCoordinate = z.int().min(-worldLimits.gridExtent).max(worldLimits.gridExtent);
const unit = z.number().min(-1).max(1);

export const labelSchema = z.string().trim().min(1).max(worldLimits.labelLength);

export const roomSchema = z.strictObject({
  id: idSchema,
  label: labelSchema,
  grid: z.strictObject({ x: gridCoordinate, z: gridCoordinate }),
  prefab: z.enum(prefabs),
});
export type Room = z.infer<typeof roomSchema>;

export const connectionSchema = z.strictObject({
  id: idSchema,
  fromRoomId: idSchema,
  toRoomId: idSchema,
  doorId: idSchema.nullable(),
  traversableWhen: exprSchema,
});
export type Connection = z.infer<typeof connectionSchema>;

export const localPositionSchema = z.strictObject({
  x: unit,
  y: z.number().min(0).max(1),
  z: unit,
});
export type LocalPosition = z.infer<typeof localPositionSchema>;

export const entitySchema = z.strictObject({
  id: idSchema,
  kind: z.enum(entityKinds),
  label: labelSchema,
  roomId: idSchema,
  localPosition: localPositionSchema,
  requires: exprSchema,
  grantsItemId: idSchema.nullable(),
  setsFlag: idSchema.nullable(),
  consumesItemId: idSchema.nullable(),
  blocksConnectionId: idSchema.nullable(),
  presentation: z.strictObject({
    variant: z.string().max(32).nullable(),
    glow: z.boolean(),
  }),
});
export type WorldEntity = z.infer<typeof entitySchema>;

export const goalSchema = z.strictObject({
  id: idSchema,
  roomId: idSchema,
  requires: exprSchema,
});
export type Goal = z.infer<typeof goalSchema>;

export const worldSpecSchema = z.strictObject({
  schemaVersion: z.literal(schemaVersion),
  id: idSchema,
  revision: z.int().min(1),
  seed: z.int().min(0).max(2_147_483_647),
  theme: z.enum(themes),
  title: z.string().trim().min(1).max(worldLimits.titleLength),
  prompt: z.string().max(worldLimits.promptLength.max),
  generationMode: z.enum(generationModes),
  rooms: z.array(roomSchema).min(worldLimits.rooms.min).max(worldLimits.rooms.max),
  connections: z
    .array(connectionSchema)
    .min(worldLimits.connections.min)
    .max(worldLimits.connections.max),
  entities: z.array(entitySchema).min(worldLimits.entities.min).max(worldLimits.entities.max),
  startRoomId: idSchema,
  goal: goalSchema,
  metadata: z.strictObject({
    createdAt: z.iso.datetime(),
    modelId: z.string().max(80).nullable(),
    adaptations: z.array(z.string().max(200)).max(worldLimits.adaptations),
  }),
});
export type WorldSpec = z.infer<typeof worldSpecSchema>;
