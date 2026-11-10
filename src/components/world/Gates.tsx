import type { ReactElement } from "react";
import type { WorldSpec } from "../../contract/world.schema.js";
import { entityById } from "../../domain/world-lookup.js";
import { Gate, type GateStyle } from "./Gate.js";
import type { CorridorLayout } from "./layout-types.js";
import { PortalPair } from "./PortalPair.js";
import { useScene } from "./scene-context.js";
import type { GateState } from "./truth.js";

type GatesProps = {
  world: WorldSpec;
  gates: ReadonlyMap<string, GateState>;
  currentRoomId: string;
  highlightIds: readonly string[];
  onMoveTo: (roomId: string) => void;
};

function styleOf(world: WorldSpec, corridor: CorridorLayout): GateStyle | null {
  if (corridor.gateEntityId === null) return corridor.conditional ? "bars" : null;
  return entityById(world, corridor.gateEntityId)?.kind === "portal" ? "grille" : "door";
}

export function Gates(props: GatesProps): ReactElement {
  const { world, gates, currentRoomId, highlightIds, onMoveTo } = props;
  const { layout } = useScene();
  const farSide = (corridor: CorridorLayout): string =>
    currentRoomId === corridor.toRoomId ? corridor.fromRoomId : corridor.toRoomId;
  const isHighlighted = (corridor: CorridorLayout): boolean =>
    highlightIds.includes(corridor.connectionId) ||
    (corridor.gateEntityId !== null && highlightIds.includes(corridor.gateEntityId));
  return (
    <group>
      {layout.corridors.map((corridor) => {
        const gate = gates.get(corridor.connectionId) ?? "closed";
        const style = styleOf(world, corridor);
        const shared = {
          corridor,
          gate,
          style: style ?? "bars",
          highlighted: isHighlighted(corridor),
          farRoomId: farSide(corridor),
          onMoveTo,
        };
        if (corridor.kind === "portal") {
          return <PortalPair key={corridor.connectionId} {...shared} />;
        }
        return style === null ? null : <Gate key={corridor.connectionId} {...shared} />;
      })}
    </group>
  );
}
