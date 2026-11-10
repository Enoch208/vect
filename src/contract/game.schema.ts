import { z } from "zod";
import { eventCodes } from "./codes.js";
import { idSchema } from "./expr.schema.js";
import { worldLimits } from "./limits.js";

export const gameActionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("MOVE_TO"), roomId: idSchema }),
  z.strictObject({ type: z.literal("INTERACT"), entityId: idSchema }),
  z.strictObject({ type: z.literal("INSPECT"), entityId: idSchema }),
  z.strictObject({ type: z.literal("WAIT"), ticks: z.int().min(1).max(worldLimits.waitTicks) }),
]);
export type GameAction = z.infer<typeof gameActionSchema>;

export const gameStateSchema = z.strictObject({
  worldRevisionHash: z.string(),
  seed: z.int(),
  currentRoomId: idSchema,
  position: z.strictObject({ x: z.number(), z: z.number() }),
  inventory: z.array(idSchema),
  activeFlags: z.record(idSchema, z.boolean()),
  unlockedDoors: z.array(idSchema),
  collectedEntities: z.array(idSchema),
  gameTick: z.int().min(0),
  won: z.boolean(),
});
export type GameState = z.infer<typeof gameStateSchema>;

export const gameEventSchema = z.strictObject({
  code: z.enum(eventCodes),
  message: z.string(),
  affectedIds: z.array(idSchema),
});
export type GameEvent = z.infer<typeof gameEventSchema>;

export type GameTransition = {
  ok: boolean;
  state: GameState;
  event: GameEvent;
};
