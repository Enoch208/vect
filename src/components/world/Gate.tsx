import { useRef, type ReactElement } from "react";
import type { Group } from "three";
import { dims } from "./blocks.js";
import { setCursor } from "./Floors.js";
import type { CorridorLayout } from "./layout-types.js";
import { useScene } from "./scene-context.js";
import type { GateState } from "./truth.js";
import { useSpring } from "./use-spring.js";

const openAngle = 1.72;
const leafHeight = 1.78;
const leafThickness = 0.16;

export type GateProps = {
  corridor: CorridorLayout;
  gate: GateState;
  highlighted: boolean;
  onPass: () => void;
};

function outward(corridor: CorridorLayout): [number, number] {
  const mid = [(corridor.from[0] + corridor.to[0]) / 2, (corridor.from[1] + corridor.to[1]) / 2];
  const dx = (mid[0] ?? 0) - corridor.gate[0];
  const dz = (mid[1] ?? 0) - corridor.gate[1];
  const length = Math.hypot(dx, dz);
  if (length > 0.01) return [dx / length, dz / length];
  return corridor.axis === "x" ? [1, 0] : [0, 1];
}

function DoorLeaf({ corridor, gate, highlighted }: GateProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const hinge = useRef<Group>(null);
  useSpring(gate === "closed" ? 0 : openAngle, reducedMotion, (angle) => {
    if (hinge.current !== null) hinge.current.rotation.y = angle;
  });
  const width = dims.doorWidth - 0.08;
  const closed = gate === "closed";
  const inset = corridor.gateEntityId === null ? 0 : -dims.wallThickness / 2;
  return (
    <group position={[inset, 0, -width / 2]}>
      <group ref={hinge}>
        <mesh position={[0, leafHeight / 2 + 0.02, width / 2]} castShadow>
          <boxGeometry args={[leafThickness, leafHeight, width]} />
          <meshStandardMaterial
            color={closed ? kit.gateClosed : kit.wall.color}
            roughness={0.7}
            emissive={highlighted ? kit.accent : kit.ink}
            emissiveIntensity={highlighted ? 0.35 : 0}
          />
        </mesh>
        <mesh position={[leafThickness / 2 + 0.03, leafHeight * 0.52, width - 0.3]}>
          <boxGeometry args={[0.07, 0.34, 0.1]} />
          <meshStandardMaterial color={closed ? kit.paper : kit.ink} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function Lamp({ gate }: { gate: GateState }): ReactElement {
  const { kit } = useScene();
  const color = gate === "closed" ? kit.gateClosed : gate === "passed" ? kit.gateOpen : kit.ink;
  return (
    <mesh position={[-dims.wallThickness / 2, dims.frameHeight + 0.36, 0]}>
      <boxGeometry args={[0.2, 0.2, 0.46]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

export function Gate(props: GateProps): ReactElement {
  const { corridor, gate, onPass } = props;
  const { interactive } = useScene();
  const [ox, oz] = outward(corridor);
  const turn = Math.atan2(-oz, ox);
  return (
    <group position={[corridor.gate[0], 0, corridor.gate[1]]}>
      <group
        rotation={[0, turn, 0]}
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
        <DoorLeaf {...props} />
        <Lamp gate={gate} />
      </group>
    </group>
  );
}
