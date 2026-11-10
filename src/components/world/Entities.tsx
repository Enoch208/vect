import { useEffect, useMemo, type ReactElement } from "react";
import { RingGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { GameState } from "../../contract/game.schema.js";
import type { WorldEntity, WorldSpec } from "../../contract/world.schema.js";
import { EntityMesh } from "./EntityMesh.js";
import { isScenery } from "./Props.js";
import type { SceneLayout } from "./layout-types.js";
import { Flat } from "./paint.js";
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

function PairRings({ world, state }: Pick<EntitiesProps, "world" | "state">): ReactElement | null {
  const { layout, kit, pairing } = useScene();
  const ringed = layout.entities
    .filter((placed) => {
      const kind = world.entities.find((entity) => entity.id === placed.id)?.kind;
      const gone = kind === "key" && isUsed(state, placed.id);
      return pairing.entityTags.has(placed.id) && !gone && placed.footprint > 0;
    })
    .map((placed) => placed.id)
    .join("|");
  const geometry = useMemo(() => {
    const ids = new Set(ringed.split("|"));
    const rings = layout.entities
      .filter((placed) => ids.has(placed.id))
      .map((placed) =>
        new RingGeometry(placed.footprint, placed.footprint + 0.08, 48)
          .rotateX(-Math.PI / 2)
          .translate(placed.position[0], 0.07, placed.position[2]),
      );
    if (rings.length === 0) return null;
    const merged = mergeGeometries(rings);
    for (const ring of rings) ring.dispose();
    return merged;
  }, [layout, ringed]);
  useEffect(
    () => () => {
      geometry?.dispose();
    },
    [geometry],
  );
  if (geometry === null) return null;
  return (
    <mesh geometry={geometry}>
      <Flat color={kit.accent} />
    </mesh>
  );
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
      <PairRings world={world} state={state} />
      {world.entities.map((entity, index) => {
        const placed = spots.get(entity.id);
        if (placed === undefined || gateIds.has(entity.id) || isScenery(world, entity.id))
          return null;
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
