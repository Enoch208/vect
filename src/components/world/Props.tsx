import { useMemo, type ReactElement } from "react";
import type { WorldSpec } from "../../contract/world.schema.js";
import type { PartInstance } from "./parts.js";
import { PartsMesh } from "./PartsMesh.js";
import { propParts } from "./props/index.js";
import { useScene } from "./scene-context.js";

const quarterTurn = Math.PI / 2;
const reach = 0.3;

type PropsProps = { world: WorldSpec; onSelect: (entityId: string | null) => void };

export function isScenery(world: WorldSpec, entityId: string): boolean {
  const entity = world.entities.find((item) => item.id === entityId);
  if (entity === undefined) return false;
  const gate = world.connections.some((connection) => connection.doorId === entityId);
  return entity.kind === "prop" || ((entity.kind === "door" || entity.kind === "portal") && !gate);
}

export function Props({ world, onSelect }: PropsProps): ReactElement {
  const { layout, interactive } = useScene();
  const placed = useMemo(
    () => layout.entities.filter((item) => isScenery(world, item.id)),
    [layout, world],
  );
  const instances = useMemo(
    () =>
      placed.flatMap((item, index): PartInstance[] => {
        const entity = world.entities.find((candidate) => candidate.id === item.id);
        if (entity === undefined) return [];
        return [
          {
            parts: propParts(world.theme, entity, index),
            position: item.position,
            turn: (index % 4) * quarterTurn,
          },
        ];
      }),
    [placed, world],
  );
  return (
    <PartsMesh
      instances={instances}
      onClick={(event) => {
        if (!interactive || event.delta > 6) return;
        const hit = placed.find(
          (item) =>
            Math.hypot(item.position[0] - event.point.x, item.position[2] - event.point.z) <
            item.footprint + reach,
        );
        if (hit === undefined) return;
        event.stopPropagation();
        onSelect(hit.id);
      }}
    />
  );
}
