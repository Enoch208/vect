import type { Expr } from "../contract/expr.schema.js";
import type { GameState } from "../contract/game.schema.js";

export function evaluate(expr: Expr, state: GameState): boolean {
  switch (expr.op) {
    case "true":
      return true;
    case "hasItem":
      return state.inventory.includes(expr.itemId);
    case "flag":
      return (state.activeFlags[expr.flagId] ?? false) === expr.value;
    case "all":
      return expr.of.every((child) => evaluate(child, state));
    case "any":
      return expr.of.some((child) => evaluate(child, state));
  }
}

export function referencedItems(expr: Expr): string[] {
  switch (expr.op) {
    case "hasItem":
      return [expr.itemId];
    case "all":
    case "any":
      return expr.of.flatMap(referencedItems);
    case "true":
    case "flag":
      return [];
  }
}

export function referencedFlags(expr: Expr): string[] {
  switch (expr.op) {
    case "flag":
      return [expr.flagId];
    case "all":
    case "any":
      return expr.of.flatMap(referencedFlags);
    case "true":
    case "hasItem":
      return [];
  }
}
