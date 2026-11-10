import { z } from "zod";
import { gameStateSchema } from "../contract/game.schema.js";
import { traceStepSchema, verificationReportSchema } from "../contract/report.schema.js";
import { worldSpecSchema } from "../contract/world.schema.js";
import { verifyWorld } from "../verification/verify.js";

export const testRequestSchema = z.strictObject({
  type: z.literal("run"),
  world: worldSpecSchema,
  seed: z.int(),
});
export type TestRequest = z.infer<typeof testRequestSchema>;

export const testWorkerMessageSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("step"),
    step: traceStepSchema,
    summary: z.string(),
    state: gameStateSchema,
  }),
  z.strictObject({ type: z.literal("report"), report: verificationReportSchema }),
  z.strictObject({ type: z.literal("error"), message: z.string() }),
]);
export type TestWorkerMessage = z.infer<typeof testWorkerMessageSchema>;

export type TestClock = { now: () => number; isoNow: () => string };

export function handleTestRequest(
  message: unknown,
  post: (message: TestWorkerMessage) => void,
  clock: TestClock,
): void {
  const parsed = testRequestSchema.safeParse(message);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue === undefined ? "" : ` at ${issue.path.join(".") || "the root"}`;
    post({ type: "error", message: `The test request was malformed${where}.` });
    return;
  }
  const { world, seed } = parsed.data;
  const report = verifyWorld(world, {
    seed,
    now: clock.now,
    isoNow: clock.isoNow,
    onStep: (step, summary, state) => {
      post({ type: "step", step, summary, state });
    },
  });
  post({ type: "report", report });
}
