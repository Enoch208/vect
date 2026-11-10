import { useRef, type ReactElement } from "react";
import type { Group } from "three";
import { dims } from "./blocks.js";
import { Cluster } from "./Cluster.js";
import { corridorBars, grilleBars } from "./entity-parts.js";
import { setCursor } from "./Floors.js";
import type { CorridorLayout } from "./layout-types.js";
import { Flat, InkEdges } from "./paint.js";
import { useScene } from "./scene-context.js";
import type { GateState } from "./truth.js";
import { usePulse, useSpring } from "./use-spring.js";

const openAngle = 1.72;
const leafHeight = 1.8;
const leafThickness = 0.16;
const leafWidth = dims.doorWidth - 0.1;
const retracted = 0.06;

export type GateStyle = "door" | "grille" | "bars";

export type GateProps = {
  corridor: CorridorLayout;
  gate: GateState;
  style: GateStyle;
  highlighted: boolean;
  onPass: () => void;
};

function outward(corridor: CorridorLayout): [number, number] {
  const dx = (corridor.from[0] + corridor.to[0]) / 2 - corridor.gate[0];
  const dz = (corridor.from[1] + corridor.to[1]) / 2 - corridor.gate[1];
  const length = Math.hypot(dx, dz);
  if (length > 0.01) return [dx / length, dz / length];
  return corridor.axis === "x" ? [1, 0] : [0, 1];
}

function DoorLeaf({ gate, highlighted }: GateProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const hinge = useRef<Group>(null);
  const shake = useRef<Group>(null);
  const closed = gate === "closed";
  useSpring(closed ? 0 : openAngle, reducedMotion, (angle) => {
    if (hinge.current !== null) hinge.current.rotation.y = angle;
  });
  usePulse(highlighted, reducedMotion, (energy) => {
    if (shake.current !== null) shake.current.rotation.y = Math.sin(energy * 26) * energy * 0.09;
  });
  return (
    <group position={[-dims.wallThickness / 2, 0, -leafWidth / 2]}>
      <group ref={hinge} rotation={[0, closed ? 0 : openAngle, 0]}>
        <group ref={shake}>
          <mesh position={[0, leafHeight / 2 + 0.02, leafWidth / 2]}>
            <boxGeometry args={[leafThickness, leafHeight, leafWidth]} />
            <Flat color={closed ? kit.gateClosed : kit.trim.color} />
            <InkEdges strong={closed} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Bars({ gate, style }: GateProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const bars = useRef<Group>(null);
  const closed = gate === "closed";
  const hung = style === "grille";
  useSpring(closed ? 1 : retracted, reducedMotion, (scale) => {
    if (bars.current !== null) bars.current.scale.y = scale;
  });
  return (
    <group
      ref={bars}
      position={[hung ? -dims.wallThickness / 2 : 0, hung ? leafHeight + 0.02 : 0, 0]}
      scale={[1, closed ? 1 : retracted, 1]}
    >
      <Cluster parts={hung ? grilleBars : corridorBars}>
        <Flat color={closed ? kit.gateClosed : kit.trim.color} />
        <InkEdges strong={closed} />
      </Cluster>
    </group>
  );
}

function Lamp({ gate }: { gate: GateState }): ReactElement {
  const { kit } = useScene();
  const color = gate === "closed" ? kit.gateClosed : gate === "passed" ? kit.gateOpen : kit.ink;
  return (
    <mesh position={[-dims.wallThickness / 2, dims.frameHeight + 0.37, 0]}>
      <boxGeometry args={[0.22, 0.22, 0.5]} />
      <Flat color={color} />
    </mesh>
  );
}

function Halo({ highlighted }: { highlighted: boolean }): ReactElement {
  const { kit, reducedMotion } = useScene();
  const ring = useRef<Group>(null);
  usePulse(highlighted, reducedMotion, (energy) => {
    if (ring.current !== null) ring.current.scale.setScalar(1 + energy * 0.7);
  });
  return (
    <group ref={ring} position={[0.5, 0.05, 0]} visible={highlighted}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.62, 56]} />
        <Flat color={kit.accent} />
      </mesh>
    </group>
  );
}

export function Gate(props: GateProps): ReactElement {
  const { corridor, gate, style, highlighted, onPass } = props;
  const { interactive } = useScene();
  const [ox, oz] = outward(corridor);
  return (
    <group
      position={[corridor.gate[0], 0, corridor.gate[1]]}
      rotation={[0, Math.atan2(-oz, ox), 0]}
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
      {style === "door" ? <DoorLeaf {...props} /> : <Bars {...props} />}
      {style === "bars" ? null : <Lamp gate={gate} />}
      <Halo highlighted={highlighted} />
    </group>
  );
}
