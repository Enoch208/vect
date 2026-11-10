import { useRef, type ReactElement } from "react";
import type { Group } from "three";
import { cameraYaw } from "./camera-math.js";
import { Cluster } from "./Cluster.js";
import {
  barrierPosts,
  checkpointBase,
  checkpointFlag,
  checkpointPole,
  goalBase,
  goalFlag,
  goalRings,
  trapPlate,
  trapStripes,
} from "./entity-parts.js";
import type { ShapeProps } from "./entity-shapes.js";
import { Flat, InkEdges, Matte } from "./paint.js";
import { useScene } from "./scene-context.js";
import { useSpring } from "./use-spring.js";

const sunk = 0.07;
const flagLow = 0.74;
const flagHigh = 1.42;

function BarrierShape({ used }: ShapeProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const posts = useRef<Group>(null);
  useSpring(used ? sunk : 1, reducedMotion, (height) => {
    if (posts.current !== null) posts.current.scale.y = height;
  });
  return (
    <group ref={posts} scale={[1, used ? sunk : 1, 1]}>
      <Cluster parts={barrierPosts}>
        {used ? <Matte tone="tint" /> : <Flat color={kit.accent} />}
        <InkEdges />
      </Cluster>
    </group>
  );
}

function TrapShape({ used }: ShapeProps): ReactElement {
  const { kit } = useScene();
  return (
    <group rotation={[0, cameraYaw, 0]}>
      <Cluster parts={trapPlate}>
        <Matte tone="tint" />
        <InkEdges />
      </Cluster>
      <Cluster parts={trapStripes} shadow={false}>
        <Flat color={used ? kit.edge : kit.accent} />
      </Cluster>
    </group>
  );
}

function CheckpointShape({ used }: ShapeProps): ReactElement {
  const { kit, reducedMotion } = useScene();
  const flag = useRef<Group>(null);
  useSpring(used ? flagHigh : flagLow, reducedMotion, (height) => {
    if (flag.current !== null) flag.current.position.y = height;
  });
  return (
    <group rotation={[0, cameraYaw, 0]}>
      <Cluster parts={checkpointBase}>
        <Matte />
      </Cluster>
      <Cluster parts={checkpointPole} shadow={false}>
        <Flat color={kit.ink} />
      </Cluster>
      <group ref={flag} position={[0.27, used ? flagHigh : flagLow, 0]}>
        <Cluster parts={checkpointFlag} shadow={false}>
          <Flat color={used ? kit.ink : kit.accent} />
        </Cluster>
      </group>
    </group>
  );
}

function GoalShape(): ReactElement {
  const { kit } = useScene();
  return (
    <group>
      <Cluster parts={goalRings} shadow={false}>
        <Flat color={kit.ink} />
      </Cluster>
      <Cluster parts={goalBase}>
        <Matte />
      </Cluster>
      <Cluster parts={goalFlag}>
        <Flat color={kit.ink} />
      </Cluster>
    </group>
  );
}

function Nothing(): null {
  return null;
}

export const fixtureShapes = {
  barrier: BarrierShape,
  trap: TrapShape,
  checkpoint: CheckpointShape,
  goal: GoalShape,
  prop: Nothing,
  door: Nothing,
  portal: Nothing,
};
