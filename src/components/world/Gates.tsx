import type { ReactElement } from "react";
import { Gate } from "./Gate.js";
import type { CorridorLayout } from "./layout-types.js";
import { PortalPair } from "./PortalPair.js";
import { useScene } from "./scene-context.js";
import type { GateState } from "./truth.js";

type GatesProps = {
  gates: ReadonlyMap<string, GateState>;
  currentRoomId: string;
  highlightIds: readonly string[];
  onMoveTo: (roomId: string) => void;
};

export function Gates(props: GatesProps): ReactElement {
  const { gates, currentRoomId, highlightIds, onMoveTo } = props;
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
        const shared = {
          corridor,
          gate,
          highlighted: isHighlighted(corridor),
          onPass: () => {
            onMoveTo(farSide(corridor));
          },
        };
        if (corridor.kind === "portal") {
          return <PortalPair key={corridor.connectionId} {...shared} />;
        }
        return corridor.gated ? <Gate key={corridor.connectionId} {...shared} /> : null;
      })}
    </group>
  );
}
