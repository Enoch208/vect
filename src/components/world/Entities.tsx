import { useMemo, type ReactElement } from "react";
import type { GameState } from "../../contract/game.schema.js";
import type { WorldEntity, WorldSpec } from "../../contract/world.schema.js";
import { EntityMesh } from "./EntityMesh.js";
import type { SceneLayout } from "./layout-types.js";
import { useScene } from "./scene-context.js";
import { isUsed, switchIsOn } from "./truth.js";

type EntitiesProps = {
  world: WorldSpec;
  state: GameState;
  highlightIds: readonly string[];
  selectedEntityId: string | null;
  onInteract: (entityId: string) => void;
  onSelect: (entityId: string | null) => void;
};

function blockerTurn(layout: SceneLayout, entity: WorldEntity): number {
  const room = layout.rooms.find((item) => item.id === entity.roomId);
  const opening = room?.openings.find((item) => item.connectionId === entity.blocksConnectionId);
  return opening?.side === "n" || opening?.side === "s" ? Math.PI / 2 : 0;
}

export function Entities(props: EntitiesProps): ReactElement {
  const { world, state, highlightIds, selectedEntityId, onInteract, onSelect } = props;
  const { layout } = useScene();
  const gateIds = useMemo(
    () => new Set(layout.corridors.flatMap((corridor) => corridor.gateEntityId ?? [])),
    [layout],
  );
  const spots = useMemo(() => new Map(layout.entities.map((item) => [item.id, item])), [layout]);
  return (
    <group>
      {world.entities.map((entity, index) => {
        const placed = spots.get(entity.id);
        if (placed === undefined || gateIds.has(entity.id)) return null;
        return (
          <EntityMesh
            key={entity.id}
            entity={entity}
            placed={placed}
            index={index}
            turn={blockerTurn(layout, entity)}
            used={isUsed(state, entity.id)}
            on={switchIsOn(state, entity)}
            highlighted={highlightIds.includes(entity.id)}
            selected={selectedEntityId === entity.id}
            onInteract={onInteract}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}
