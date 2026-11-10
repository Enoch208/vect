import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { GameEvent, GameState } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { describeGoal, itemLabel } from "../studio/describe.js";

export function Hud({
  world,
  state,
  lastEvent,
  refused,
}: {
  world: WorldSpec;
  state: GameState;
  lastEvent: GameEvent | null;
  refused: boolean;
}) {
  return (
    <div className="grid gap-4 border-t border-rule bg-paper p-4 text-body md:grid-cols-[2fr_1fr]">
      <div className="space-y-2">
        <p className="studio-label text-muted">Objective</p>
        <p>{describeGoal(world)}</p>
        {lastEvent && (
          <p
            role="status"
            className={`flex items-start gap-2 ${refused ? "text-accent" : "text-ink-72"}`}
          >
            <HugeiconsIcon
              icon={refused ? AlertCircleIcon : CheckmarkCircle02Icon}
              size={16}
              aria-hidden
              className="shrink-0"
            />
            <span>
              {refused ? "Refused: " : ""}
              {lastEvent.message}
            </span>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <p className="studio-label text-muted">
          Inventory · Tick <span className="font-mono tabular-nums">{state.gameTick}</span>
        </p>
        <p>
          {state.inventory.length
            ? state.inventory.map((id) => itemLabel(id, world)).join(" · ")
            : "Empty"}
        </p>
      </div>
    </div>
  );
}
