import { memo, type ReactElement } from "react";
import { setCursor } from "./Floors.js";
import type { GateProps } from "./Gate.js";
import type { Point } from "./layout-types.js";
import { useScene } from "./scene-context.js";

type PadProps = { at: Point; closed: boolean; passed: boolean; onPass: () => void };

function Pad({ at, closed, passed, onPass }: PadProps): ReactElement {
  const { kit, interactive } = useScene();
  const color = closed ? kit.gateClosed : passed ? kit.gateOpen : kit.ink;
  return (
    <group
      position={[at[0], 0, at[1]]}
      onClick={(event) => {
        if (!interactive || event.delta > 6) return;
        event.stopPropagation();
        onPass();
      }}
      onPointerOver={(event) => {
        if (interactive) setCursor(event, "pointer");
      }}
      onPointerOut={(event) => {
        setCursor(event, "default");
      }}
    >
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.92, 1, 0.12, 40]} />
        <meshStandardMaterial color={kit.wall.color} roughness={0.9} />
      </mesh>
      {[0.82, 0.52].map((radius) => (
        <mesh key={radius} position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.08, radius, 48]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
      {closed ? (
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.74, 6, 1, true]} />
          <meshStandardMaterial color={kit.gateClosed} roughness={0.6} wireframe />
        </mesh>
      ) : null}
    </group>
  );
}

type PairProps = Pick<GateProps, "corridor" | "gate" | "farRoomId" | "onMoveTo">;

export const PortalPair = memo(function PortalPair(props: PairProps): ReactElement {
  const { corridor, gate, farRoomId, onMoveTo } = props;
  const onPass = () => {
    onMoveTo(farRoomId);
  };
  const shared = { closed: gate === "closed", passed: gate === "passed", onPass };
  return (
    <group>
      <Pad at={corridor.from} {...shared} />
      <Pad at={corridor.to} {...shared} />
    </group>
  );
});
