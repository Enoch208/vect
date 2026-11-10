import type { GameState } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import {
  adjacentRoomIds,
  entitiesIn,
  isInteractive,
  isTraversable,
} from "../../domain/world-lookup.js";

export function RoomActions({
  world,
  state,
  onMove,
  onInteract,
}: {
  world: WorldSpec;
  state: GameState;
  onMove: (roomId: string) => void;
  onInteract: (entityId: string) => void;
}) {
  const room = world.rooms.find((item) => item.id === state.currentRoomId);
  const objects = entitiesIn(world, state.currentRoomId).filter(isInteractive);
  return (
    <section aria-label="Room controls" className="space-y-3">
      <p className="studio-label text-muted">You are in</p>
      <h2 className="font-display text-lg font-semibold uppercase">
        {room?.label ?? state.currentRoomId}
      </h2>
      <p className="studio-label text-muted">Move to</p>
      {adjacentRoomIds(world, state.currentRoomId).map((id) => {
        const routes = world.connections.filter(
          (route) =>
            (route.fromRoomId === state.currentRoomId && route.toRoomId === id) ||
            (route.toRoomId === state.currentRoomId && route.fromRoomId === id),
        );
        const locked = !routes.some((route) => isTraversable(world, state, route));
        return (
          <button
            key={id}
            type="button"
            className="studio-button w-full justify-between text-left"
            disabled={state.won}
            onClick={() => {
              onMove(id);
            }}
          >
            <span>{world.rooms.find((item) => item.id === id)?.label ?? id} →</span>
            {locked && <span className="text-accent">Locked</span>}
          </button>
        );
      })}
      <p className="studio-label pt-3 text-muted">Objects here</p>
      {objects.length === 0 && (
        <p className="text-body-s text-muted">Nothing to use here. Explore a connected room.</p>
      )}
      {objects.map((entity) => (
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
    </section>
  );
}
