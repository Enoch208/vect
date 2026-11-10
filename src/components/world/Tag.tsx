import monoWoff from "@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff?url";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactElement } from "react";
import { Euler, type Group } from "three";
import { badgeGeometry } from "./badge-geometry.js";
import { cameraPitch, cameraYaw } from "./camera-math.js";
import { badgeMarks, labelSize, labelType } from "./label-layout.js";
import { labelCharacters, plainLabel, useScene } from "./scene-context.js";

export type TagTone = "ink" | "muted" | "accent" | "positive" | "alert" | "actor";

export type TagProps = {
  anchor: [number, number, number];
  lines: readonly string[];
  badge?: string | null;
  tone?: TagTone;
  below?: boolean;
  lift?: number;
  shift?: number;
};

const facing = new Euler(-cameraPitch, cameraYaw, 0, "YXZ");
const clearance = 7;
const chipPad: [number, number] = [7, 4];
const row = labelType.size * labelType.lineHeight;

export function Tag(props: TagProps): ReactElement {
  const { anchor, lines, badge = null, tone = "ink", below = false, lift = 0, shift = 0 } = props;
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
  const marks = badgeMarks(badge);
  const rows = marks.length === 0 ? lines : [marks.join(" "), ...lines];
  const size = labelSize(lines, badge);
  const side = below ? -1 : 1;
  const reach = lift + clearance + (filled ? chipPad[1] : 0);
  const middle = side * (reach + size.height / 2);
  const top = middle + size.height / 2;
  return (
    <group position={anchor} rotation={facing}>
      <group ref={scaled} scale={0.05}>
        {lift > 0 ? (
          <mesh position={[0, (side * (lift + clearance)) / 2, 0]} renderOrder={11}>
            <planeGeometry args={[1, lift + clearance]} />
            <meshBasicMaterial color={kit.edge} toneMapped={false} depthTest={false} />
          </mesh>
        ) : null}
        <group position={[shift, 0, 0]}>
          {filled ? (
            <mesh position={[0, middle, 0]} renderOrder={11}>
              <planeGeometry args={[size.width + chipPad[0] * 2, size.height + chipPad[1] * 2]} />
              <meshBasicMaterial color={fill} toneMapped={false} depthTest={false} />
            </mesh>
          ) : null}
          {marks.map((mark, index) => (
            <mesh
              key={mark}
              renderOrder={11}
              position={[(index - (marks.length - 1) / 2) * labelType.markPitch, top - row / 2, 0]}
              geometry={badgeGeometry(filled ? fill : kit.paper, filled ? kit.paper : kit.accent)}
            >
              <meshBasicMaterial vertexColors toneMapped={false} depthTest={false} />
            </mesh>
          ))}
          <Text
            font={monoWoff}
            characters={labelCharacters}
            fontSize={labelType.size}
            lineHeight={labelType.lineHeight}
            letterSpacing={0.04}
            color={colors[tone]}
            anchorX="center"
            anchorY="middle"
            textAlign="center"
            position={[0, middle, 0]}
            outlineWidth={filled ? 0 : 2.4}
            outlineColor={kit.paper}
            renderOrder={12}
          >
            <meshBasicMaterial toneMapped={false} depthTest={false} depthWrite={false} />
            {plainLabel(rows.join("\n"))}
          </Text>
        </group>
      </group>
    </group>
  );
}
