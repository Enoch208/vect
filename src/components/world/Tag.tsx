import monoWoff from "@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff?url";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactElement } from "react";
import { Euler, type Group } from "three";
import { cameraPitch, cameraYaw } from "./camera-math.js";
import { labelSize, labelType } from "./label-layout.js";
import { labelCharacters, plainLabel, useScene } from "./scene-context.js";

export type TagTone = "ink" | "muted" | "accent" | "positive" | "alert" | "actor";

export type TagProps = {
  anchor: [number, number, number];
  lines: readonly string[];
  badge?: string | null;
  tone?: TagTone;
  below?: boolean;
  lift?: number;
};

const facing = new Euler(-cameraPitch, cameraYaw, 0, "YXZ");
const clearance = 7;
const chipPad: [number, number] = [7, 4];

function Glyphs(props: {
  text: string;
  color: string;
  y: number;
  anchorY: "top" | "bottom" | "middle";
  halo: string | null;
}): ReactElement {
  return (
    <Text
      font={monoWoff}
      characters={labelCharacters}
      fontSize={labelType.size}
      lineHeight={labelType.lineHeight}
      letterSpacing={0.04}
      color={props.color}
      anchorX="center"
      anchorY={props.anchorY}
      textAlign="center"
      position={[0, props.y, 0]}
      outlineWidth={props.halo === null ? 0 : 2.4}
      outlineColor={props.halo ?? props.color}
      renderOrder={12}
    >
      <meshBasicMaterial toneMapped={false} depthTest={false} depthWrite={false} />
      {props.text}
    </Text>
  );
}

export function Tag(props: TagProps): ReactElement {
  const { anchor, lines, badge = null, tone = "ink", below = false, lift = 0 } = props;
  const { kit } = useScene();
  const scaled = useRef<Group>(null);
  useFrame((three) => {
    const scale = 1 / three.camera.zoom;
    if (scaled.current !== null && scaled.current.scale.x !== scale) {
      scaled.current.scale.setScalar(scale);
    }
  });
  const filled = tone === "alert" || tone === "actor";
  const fill = tone === "alert" ? kit.accent : kit.ink;
  const colors: Record<TagTone, string> = {
    ink: kit.ink,
    muted: kit.edge,
    accent: kit.accent,
    positive: kit.gateOpen,
    alert: kit.paper,
    actor: kit.paper,
  };
  const text = labelSize(lines);
  const base = (below ? -1 : 1) * (lift + clearance + (filled ? chipPad[1] : 0));
  const middle = base + (below ? -text.height / 2 : text.height / 2);
  const badgeY = below ? base - text.height - labelType.badge / 2 : base + text.height + 11;
  return (
    <group position={anchor} rotation={facing}>
      <group ref={scaled} scale={0.05}>
        {lift > 0 ? (
          <mesh position={[0, ((below ? -1 : 1) * (lift + clearance)) / 2, 0]} renderOrder={11}>
            <planeGeometry args={[1, lift + clearance]} />
            <meshBasicMaterial color={kit.edge} toneMapped={false} depthTest={false} />
          </mesh>
        ) : null}
        {filled && lines.length > 0 ? (
          <mesh position={[0, middle, 0]} renderOrder={11}>
            <planeGeometry args={[text.width + chipPad[0] * 2, text.height + chipPad[1] * 2]} />
            <meshBasicMaterial color={fill} toneMapped={false} depthTest={false} />
          </mesh>
        ) : null}
        {lines.length > 0 ? (
          <Glyphs
            text={plainLabel(lines.join("\n"))}
            color={colors[tone]}
            y={middle}
            anchorY="middle"
            halo={filled ? null : kit.paper}
          />
        ) : null}
        {badge === null ? null : (
          <group position={[0, badgeY, 0]}>
            <mesh renderOrder={11}>
              <circleGeometry args={[10, 32]} />
              <meshBasicMaterial color={kit.paper} toneMapped={false} depthTest={false} />
            </mesh>
            <mesh renderOrder={11}>
              <ringGeometry args={[8.6, 10, 40]} />
              <meshBasicMaterial color={kit.accent} toneMapped={false} depthTest={false} />
            </mesh>
            <Glyphs
              text={plainLabel(badge)}
              color={kit.accent}
              y={0}
              anchorY="middle"
              halo={null}
            />
          </group>
        )}
      </group>
    </group>
  );
}
