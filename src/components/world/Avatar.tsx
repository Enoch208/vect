import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactElement } from "react";
import type { Group } from "three";
import type { GameState } from "../../contract/game.schema.js";
import { Figure } from "./Figure.js";
import type { Point } from "./layout-types.js";
import { useScene } from "./scene-context.js";
import { stepSpring, type Spring, type SpringConfig } from "./spring.js";
import { Tag } from "./Tag.js";
import { continues } from "./transition.js";
import { stride, walkRoute, type Route } from "./walk.js";

const pace: SpringConfig = { stiffness: 26, damping: 10.2 };
const floorLift = 0.04;
const leanPerSpeed = 0.022;
const maxLean = 0.2;

type AvatarProps = {
  anchor: Point;
  state: GameState;
  openConnectionIds: ReadonlySet<string>;
  actor: "player" | "agent";
};

type Shown = { point: Point; state: GameState };
type Walk = { route: Route; travelled: Spring };

export function Avatar({ anchor, state, openConnectionIds, actor }: AvatarProps): ReactElement {
  const { layout, reducedMotion, overlay } = useScene();
  const invalidate = useThree((three) => three.invalidate);
  const body = useRef<Group>(null);
  const lean = useRef<Group>(null);
  const chip = useRef<Group>(null);
  const shown = useRef<Shown | null>(null);
  const walk = useRef<Walk | null>(null);
  const active = useRef(true);

  useEffect(() => {
    const before = shown.current;
    const animate = before !== null && !reducedMotion && continues(before.state, state);
    const route = animate
      ? walkRoute(
          layout,
          before.point,
          before.state.currentRoomId,
          anchor,
          state.currentRoomId,
          openConnectionIds,
        )
      : null;
    walk.current = route === null ? null : { route, travelled: { value: 0, velocity: 0 } };
    shown.current = { point: route === null || before === null ? anchor : before.point, state };
    active.current = true;
    invalidate();
  }, [anchor, state, layout, openConnectionIds, reducedMotion, invalidate]);

  useFrame((three, delta) => {
    const node = body.current;
    const current = shown.current;
    if (!active.current || node === null || current === null) return;
    const walking = walk.current;
    const resting =
      walking === null || stepSpring(walking.travelled, walking.route.length, delta, pace);
    const pose =
      walking === null
        ? { point: current.point, heading: node.rotation.y, hidden: false }
        : stride(walking.route, walking.travelled.value);
    current.point = pose.point;
    node.position.set(pose.point[0], floorLift, pose.point[1]);
    node.rotation.y = pose.heading;
    node.visible = !pose.hidden;
    const speed = walking === null ? 0 : walking.travelled.velocity;
    if (lean.current !== null) {
      lean.current.rotation.x = Math.min(maxLean, Math.max(0, speed * leanPerSpeed));
    }
    if (chip.current !== null) {
      chip.current.position.copy(node.position);
      chip.current.visible = node.visible;
    }
    three.gl.shadowMap.needsUpdate = true;
    if (resting) {
      active.current = false;
      walk.current = null;
    } else {
      three.invalidate();
    }
  });

  return (
    <>
      <group ref={body} position={[anchor[0], floorLift, anchor[1]]}>
        <group ref={lean}>
          <Figure actor={actor} />
        </group>
      </group>
      {createPortal(
        <group ref={chip} position={[anchor[0], floorLift, anchor[1]]}>
          <Tag
            anchor={[0, actor === "player" ? 2.3 : 1.9, 0]}
            lines={[actor === "player" ? "YOU" : "TEST AGENT"]}
            tone="actor"
          />
        </group>,
        overlay,
      )}
    </>
  );
}
