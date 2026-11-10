import type { ReactElement } from "react";
import type { WorldEntity } from "../../contract/world.schema.js";
import { isInteractive } from "../../domain/world-lookup.js";
import { shapes } from "./entity-shapes.js";
import { setCursor } from "./Floors.js";
import type { EntityLayout } from "./layout-types.js";
import { useScene } from "./scene-context.js";

export type EntityMeshProps = {
  entity: WorldEntity;
  placed: EntityLayout;
  index: number;
  turn: number;
  used: boolean;
  on: boolean;
  highlighted: boolean;
  selected: boolean;
  onInteract: (entityId: string) => void;
  onSelect: (entityId: string | null) => void;
};

function Ring({ radius, color }: { radius: number; color: string }): ReactElement {
  return (
    <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.08, 48]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

export function EntityMesh(props: EntityMeshProps): ReactElement {
  const { entity, placed, index, turn, used, on, highlighted, selected } = props;
  const { onInteract, onSelect } = props;
  const { kit, interactive } = useScene();
  const Shape = shapes[entity.kind];
  const usable = isInteractive(entity);
  return (
    <group
      position={placed.position}
      onClick={(event) => {
        if (!interactive || event.delta > 6) return;
        event.stopPropagation();
        if (usable) onInteract(entity.id);
        else onSelect(entity.id);
      }}
      onPointerOver={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        setCursor(event, "pointer");
      }}
      onPointerOut={(event) => {
        setCursor(event, "default");
      }}
    >
      <group rotation={[0, turn, 0]}>
        <Shape used={used} on={on} variant={index} />
      </group>
      {highlighted || selected ? (
        <Ring radius={placed.footprint + 0.22} color={highlighted ? kit.accent : kit.ink} />
      ) : null}
    </group>
  );
}
