import { z } from "zod";
import { worldLimits } from "./limits.js";

export const idSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,47}$/);
export type Id = z.infer<typeof idSchema>;

export type Expr =
  | { op: "true" }
  | { op: "hasItem"; itemId: Id }
  | { op: "flag"; flagId: Id; value: boolean }
  | { op: "all"; of: Expr[] }
  | { op: "any"; of: Expr[] };

const rawExprSchema: z.ZodType<Expr> = z.lazy(() =>
  z.discriminatedUnion("op", [
    z.strictObject({ op: z.literal("true") }),
    z.strictObject({ op: z.literal("hasItem"), itemId: idSchema }),
    z.strictObject({ op: z.literal("flag"), flagId: idSchema, value: z.boolean() }),
    z.strictObject({ op: z.literal("all"), of: z.array(rawExprSchema).min(1).max(8) }),
    z.strictObject({ op: z.literal("any"), of: z.array(rawExprSchema).min(1).max(8) }),
  ]),
);

export function exprDepth(expr: Expr): number {
  if (expr.op === "all" || expr.op === "any") {
    return 1 + Math.max(...expr.of.map(exprDepth));
  }
  return 1;
}

export function exprPredicates(expr: Expr): number {
  if (expr.op === "all" || expr.op === "any") {
    return expr.of.reduce((total, child) => total + exprPredicates(child), 0);
  }
  return 1;
}

export const exprSchema = rawExprSchema.refine(
  (expr) =>
    exprDepth(expr) <= worldLimits.exprDepth && exprPredicates(expr) <= worldLimits.exprPredicates,
  { message: `Expressions are at most ${String(worldLimits.exprDepth)} deep` },
);

export const alwaysTrue: Expr = { op: "true" };
