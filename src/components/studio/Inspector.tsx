import type { GameState } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { RoomActions } from "../game/RoomActions.js";
import { describeEntity } from "./describe.js";

export function Inspector({
  world,
  state,
  selectedId,
  interactive,
  onSelect,
  onMove,
  onInteract,
}: {
  world: WorldSpec;
  state: GameState;
  selectedId: string | null;
  interactive: boolean;
  onSelect: (id: string | null) => void;
  onMove: (id: string) => void;
  onInteract: (id: string) => void;
}) {
  const selected = world.entities.find((entity) => entity.id === selectedId);
  return (
    <aside className="space-y-6 overflow-y-auto border-l border-rule p-4 text-body">
      <div className="space-y-3">
        <p className="studio-label text-muted">Inspector</p>
        <label className="sr-only" htmlFor="inspect-entity">
          Inspect an entity
        </label>
        <select
          id="inspect-entity"
          className="studio-field w-full text-body-s"
          value={selectedId ?? ""}
          onChange={(event) => {
            onSelect(event.target.value || null);
          }}
        >
          <option value="">Select an object</option>
          {world.entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.label}
            </option>
          ))}
        </select>
        {selected && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold uppercase">{selected.label}</h2>
            <p className="font-mono text-micro uppercase text-muted">
              {selected.kind} · {selected.id}
            </p>
            {describeEntity(selected, world).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-3 border-t border-rule pt-4">
        {interactive && (
          <RoomActions world={world} state={state} onMove={onMove} onInteract={onInteract} />
        )}
      </div>
    </aside>
  );
}
