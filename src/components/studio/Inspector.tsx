import type { GameState } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { adjacentRoomIds, entitiesIn, isInteractive } from "../../domain/world-lookup.js";
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
  const room = world.rooms.find((item) => item.id === state.currentRoomId);
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
        <p className="studio-label text-muted">You are in</p>
        <h2 className="font-display text-lg font-semibold uppercase">
          {room?.label ?? state.currentRoomId}
        </h2>
        {interactive && (
          <>
            <p className="studio-label text-muted">Move to</p>
            {adjacentRoomIds(world, state.currentRoomId).map((id) => (
              <button
                key={id}
                type="button"
                className="studio-button w-full text-left"
                disabled={state.won}
                onClick={() => {
                  onMove(id);
                }}
              >
                {world.rooms.find((item) => item.id === id)?.label ?? id} →
              </button>
            ))}
            <p className="studio-label pt-3 text-muted">Objects here</p>
            {entitiesIn(world, state.currentRoomId)
              .filter(isInteractive)
              .map((entity) => (
                <button
                  key={entity.id}
                  type="button"
                  className="studio-button w-full text-left"
                  disabled={state.won || state.collectedEntities.includes(entity.id)}
                  onClick={() => {
                    onInteract(entity.id);
                  }}
                >
                  {entity.label}
                  {state.collectedEntities.includes(entity.id) ? " · Used" : ""}
                </button>
              ))}
          </>
        )}
      </div>
    </aside>
  );
}
