import { useRef, type ReactElement } from "react";
import type { Group } from "three";
import type { EntityKind } from "../../contract/codes.js";
import { cameraYaw } from "./camera-math.js";
import { fixtureShapes } from "./fixture-shapes.js";
import { Flat, InkEdges, Matte } from "./paint.js";
import { useScene } from "./scene-context.js";
import { clunk, glide } from "./spring.js";
import { useSpring } from "./use-spring.js";

export type ShapeProps = { used: boolean; on: boolean; variant: number };

function Pedestal({ height, radius }: { height: number; radius: number }): ReactElement {
  return (
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius * 1.14, height, 24]} />
      <Matte />
      <InkEdges />
    </mesh>
  );
}

function KeyShape({ used }: ShapeProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const token = useRef<Group>(null);
  useSpring(
    used ? 1 : 0,
    reducedMotion,
    (taken) => {
      const node = token.current;
      if (node === null) return;
      const left = Math.max(0, 1 - taken);
      node.position.y = 1.2 + taken * 1.1;
      node.rotation.y = cameraYaw + taken * 5;
      node.scale.setScalar(left);
      node.visible = left > 0.02;
    },
    glide,
  );
  return (
    <group>
      <Pedestal height={0.56} radius={0.36} />
      <group ref={token} position={[0, 1.2, 0]} rotation={[0, cameraYaw, 0]}>
        <mesh position={[-0.2, 0, 0]} castShadow>
          <torusGeometry args={[0.2, 0.065, 10, 28]} />
          <Flat color={kit.accent} />
        </mesh>
        <mesh position={[0.26, 0, 0]} castShadow>
          <boxGeometry args={[0.56, 0.1, 0.1]} />
          <Flat color={kit.accent} />
        </mesh>
        {[0.34, 0.5].map((x) => (
          <mesh key={x} position={[x, -0.12, 0]} castShadow>
            <boxGeometry args={[0.09, 0.16, 0.1]} />
            <Flat color={kit.accent} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function SwitchShape({ on }: ShapeProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const lever = useRef<Group>(null);
  useSpring(
    on ? -0.62 : 0.62,
    reducedMotion,
    (angle) => {
      if (lever.current !== null) lever.current.rotation.z = angle;
    },
    clunk,
  );
  return (
    <group rotation={[0, cameraYaw, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.84, 0.6, 0.56]} />
        <Matte />
        <InkEdges />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.3]} />
        <Matte tone="tint" />
        <InkEdges />
      </mesh>
      <group ref={lever} position={[0, 0.62, 0]} rotation={[0, 0, on ? -0.62 : 0.62]}>
        <mesh position={[0, 0.34, 0]} castShadow>
          <boxGeometry args={[0.1, 0.68, 0.1]} />
          <Flat color={kit.ink} />
        </mesh>
        <mesh position={[0, 0.74, 0]} castShadow>
          <sphereGeometry args={[0.16, 18, 14]} />
          <Flat color={on ? kit.ink : kit.accent} />
        </mesh>
      </group>
    </group>
  );
}

function ChestShape({ used }: ShapeProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const lid = useRef<Group>(null);
  useSpring(used ? -1.2 : 0, reducedMotion, (angle) => {
    if (lid.current !== null) lid.current.rotation.x = angle;
  });
  return (
    <group rotation={[0, cameraYaw, 0]}>
      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.52, 0.66]} />
        <Matte />
        <InkEdges />
      </mesh>
      <group ref={lid} position={[0, 0.52, -0.33]} rotation={[used ? -1.2 : 0, 0, 0]}>
        <mesh position={[0, 0.09, 0.33]} castShadow>
          <boxGeometry args={[1.04, 0.18, 0.7]} />
          {used ? <Matte tone="tint" /> : <Flat color={kit.accent} />}
          <InkEdges strong={!used} />
        </mesh>
      </group>
    </group>
  );
}

export const shapes: Record<EntityKind, (props: ShapeProps) => ReactElement | null> = {
  key: KeyShape,
  switch: SwitchShape,
  chest: ChestShape,
  ...fixtureShapes,
};
