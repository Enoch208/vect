import { Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, type ReactElement } from "react";
import { buildParts } from "./part-geometry.js";
import type { PartInstance, PartTone } from "./parts.js";
import { useScene } from "./scene-context.js";
import type { ThemeKit } from "./themes.js";

type PartsMeshProps = {
  instances: readonly PartInstance[];
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
};

function colorOf(kit: ThemeKit, tone: PartTone): string {
  if (tone === "ink") return kit.ink;
  if (tone === "tint") return kit.trim.color;
  return tone === "fixture" ? kit.fixture.color : kit.wall.color;
}

export function PartsMesh({ instances, onClick }: PartsMeshProps): ReactElement | null {
  const { kit } = useScene();
  const built = useMemo(() => buildParts(instances), [instances]);
  useEffect(
    () => () => {
      for (const mesh of built.meshes) mesh.geometry.dispose();
    },
    [built],
  );
  if (built.meshes.length === 0) return null;
  return (
    <group {...(onClick === undefined ? {} : { onClick })}>
      {built.meshes.map(({ tone, geometry }) => (
        <mesh key={tone} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={colorOf(kit, tone)}
            roughness={tone === "ink" ? 0.6 : 0.9}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      ))}
      {built.edges.length > 0 ? (
        <Line points={built.edges} segments color={kit.edge} lineWidth={1} />
      ) : null}
    </group>
  );
}
