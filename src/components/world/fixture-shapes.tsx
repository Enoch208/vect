import { useRef, type ReactElement } from "react";
import type { Group } from "three";
import { cameraYaw } from "./camera-math.js";
import type { ShapeProps } from "./entity-shapes.js";
import { Flat, InkEdges, Matte } from "./paint.js";
import { useScene } from "./scene-context.js";
import { useSpring } from "./use-spring.js";

function BarrierShape({ used }: ShapeProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const posts = useRef<Group>(null);
  useSpring(used ? 0.07 : 1, reducedMotion, (height) => {
    if (posts.current !== null) posts.current.scale.y = height;
  });
  return (
    <group ref={posts} scale={[1, used ? 0.07 : 1, 1]}>
      {[-0.56, 0, 0.56].map((offset) => (
        <mesh key={offset} position={[0, 0.72, offset]} castShadow>
          <boxGeometry args={[0.18, 1.44, 0.18]} />
          <Flat color={kit.accent} />
          <InkEdges strong />
        </mesh>
      ))}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.12, 1.5]} />
        <Flat color={kit.accent} />
        <InkEdges strong />
      </mesh>
    </group>
  );
}

function TrapShape({ used }: ShapeProps): ReactElement {
  const { kit } = useScene();
  return (
    <group rotation={[0, cameraYaw, 0]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.16, 0.08, 1.16]} />
        <Matte tone="tint" />
        <InkEdges />
      </mesh>
      {[-0.32, 0, 0.32].map((offset) => (
        <mesh key={offset} position={[offset, 0.1, 0]} rotation={[0, 0.6, 0]}>
          <boxGeometry args={[0.12, 0.03, 0.86]} />
          <Flat color={used ? kit.edge : kit.accent} />
        </mesh>
      ))}
    </group>
  );
}

function CheckpointShape({ used }: ShapeProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const flag = useRef<Group>(null);
  useSpring(used ? 1.42 : 0.74, reducedMotion, (height) => {
    if (flag.current !== null) flag.current.position.y = height;
  });
  return (
    <group rotation={[0, cameraYaw, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.44, 0.5, 0.16, 28]} />
        <Matte />
        <InkEdges />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
        <Flat color={kit.ink} />
      </mesh>
      <group ref={flag} position={[0.27, used ? 1.42 : 0.74, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.32, 0.03]} />
          <Flat color={used ? kit.ink : kit.accent} />
        </mesh>
      </group>
    </group>
  );
}

function GoalShape(): ReactElement {
  const { kit } = useScene();
  return (
    <group>
      {[0.98, 0.66].map((radius) => (
        <mesh key={radius} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.07, radius, 56]} />
          <Flat color={kit.ink} />
        </mesh>
      ))}
      {[0, Math.PI / 2].map((turn) => (
        <mesh key={turn} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, turn]}>
          <planeGeometry args={[0.05, 2.5]} />
          <Flat color={kit.ink} />
        </mesh>
      ))}
      <mesh position={[0, 2.72, 0]} rotation={[0, cameraYaw, 0]} castShadow>
        <octahedronGeometry args={[0.34, 0]} />
        <Flat color={kit.ink} />
      </mesh>
    </group>
  );
}

function PropShape({ variant }: ShapeProps): ReactElement {
  const tall = variant % 2 === 0;
  return (
    <mesh position={[0, tall ? 0.55 : 0.3, 0]} castShadow receiveShadow>
      {tall ? (
        <cylinderGeometry args={[0.32, 0.4, 1.1, 20]} />
      ) : (
        <boxGeometry args={[1, 0.6, 0.7]} />
      )}
      <Matte tone="fixture" />
      <InkEdges />
    </mesh>
  );
}

export const fixtureShapes = {
  barrier: BarrierShape,
  trap: TrapShape,
  checkpoint: CheckpointShape,
  goal: GoalShape,
  prop: PropShape,
  door: PropShape,
  portal: PropShape,
};
