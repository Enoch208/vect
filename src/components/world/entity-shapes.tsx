import { useRef, type ReactElement } from "react";
import type { Group, MeshBasicMaterial } from "three";
import type { EntityKind } from "../../contract/codes.js";
import { cameraYaw } from "./camera-math.js";
import { Cluster } from "./Cluster.js";
import { chestBody, chestLid, keyToken, leverArm, pedestal, switchBody } from "./entity-parts.js";
import { fixtureShapes } from "./fixture-shapes.js";
import { Flat, InkEdges, Matte } from "./paint.js";
import { useScene } from "./scene-context.js";
import { clunk, glide } from "./spring.js";
import { useSpring } from "./use-spring.js";

export type ShapeProps = { used: boolean; on: boolean; variant: number };

const tokenHeight = 1.2;
const leverThrow = 0.62;
const lidSwing = -1.2;

function KeyShape({ used }: ShapeProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const token = useRef<Group>(null);
  const material = useRef<MeshBasicMaterial>(null);
  useSpring(
    used ? 1 : 0,
    reducedMotion,
    (taken) => {
      const node = token.current;
      if (node === null) return;
      const left = Math.max(0, 1 - taken);
      node.position.y = tokenHeight + taken * 1.1;
      node.rotation.y = cameraYaw + taken * 5;
      node.scale.setScalar(left);
      if (material.current !== null) material.current.opacity = left;
      node.visible = left > 0.02;
    },
    glide,
  );
  return (
    <group>
      <Cluster parts={pedestal}>
        <Matte />
      </Cluster>
      <group
        ref={token}
        position={[0, tokenHeight, 0]}
        rotation={[0, cameraYaw, 0]}
        scale={used ? 0 : 1}
        visible={!used}
      >
        <Cluster parts={keyToken} shadow={false}>
          <meshBasicMaterial
            ref={material}
            color={kit.accent}
            toneMapped={false}
            transparent
            opacity={used ? 0 : 1}
            depthWrite={false}
          />
        </Cluster>
      </group>
    </group>
  );
}

function SwitchShape({ on }: ShapeProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const lever = useRef<Group>(null);
  useSpring(
    on ? -leverThrow : leverThrow,
    reducedMotion,
    (angle) => {
      if (lever.current !== null) lever.current.rotation.z = angle;
    },
    clunk,
  );
  return (
    <group rotation={[0, cameraYaw, 0]}>
      <Cluster parts={switchBody}>
        <Matte />
        <InkEdges />
      </Cluster>
      <group ref={lever} position={[0, 0.62, 0]} rotation={[0, 0, on ? -leverThrow : leverThrow]}>
        <Cluster parts={leverArm} shadow={false}>
          <Flat color={kit.ink} />
        </Cluster>
        <mesh position={[0, 0.74, 0]}>
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
  useSpring(used ? lidSwing : 0, reducedMotion, (angle) => {
    if (lid.current !== null) lid.current.rotation.x = angle;
  });
  return (
    <group rotation={[0, cameraYaw, 0]}>
      <Cluster parts={chestBody}>
        <Matte />
        <InkEdges />
      </Cluster>
      <group ref={lid} position={[0, 0.52, -0.33]} rotation={[used ? lidSwing : 0, 0, 0]}>
        <Cluster parts={chestLid}>
          {used ? <Matte tone="tint" /> : <Flat color={kit.accent} />}
          <InkEdges strong={!used} />
        </Cluster>
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
