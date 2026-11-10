import { Line } from "@react-three/drei";
import { useEffect, useMemo, type ReactElement } from "react";
import { BoxGeometry, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { architectureBlocks, blockEdges, type Block, type BlockPart } from "./blocks.js";
import { hairlines } from "./hairlines.js";
import { useScene } from "./scene-context.js";
import { themeBlocks } from "./theme-detail.js";
import type { MaterialSpec } from "./themes.js";

function mergeBlocks(blocks: readonly Block[]): BufferGeometry | null {
  if (blocks.length === 0) return null;
  const boxes = blocks.map((block) => {
    const geometry =
      block.part === "plinth" || block.part === "bridge"
        ? new RoundedBoxGeometry(...block.size, 2, 0.07)
        : new BoxGeometry(...block.size).toNonIndexed();
    return geometry.translate(...block.center);
  });
  const merged = mergeGeometries(boxes);
  for (const box of boxes) box.dispose();
  return merged;
}

function Shell({ geometry, spec }: { geometry: BufferGeometry | null; spec: MaterialSpec }) {
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (geometry === null) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={spec.color}
        roughness={spec.roughness}
        metalness={spec.metalness}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  );
}

export function Architecture(): ReactElement {
  const { layout, kit } = useScene();
  const blocks = useMemo(() => {
    const structure = architectureBlocks(layout);
    return [...structure, ...themeBlocks(layout, structure, kit.detail)];
  }, [layout, kit.detail]);
  const parts = useMemo(() => {
    const of = (wanted: readonly BlockPart[]) =>
      mergeBlocks(blocks.filter((block) => wanted.includes(block.part)));
    return { shell: of(["plinth", "bridge", "wall"]), trim: of(["frame", "rail"]) };
  }, [blocks]);
  const edges = useMemo(() => blocks.flatMap(blockEdges), [blocks]);
  const fine = useMemo(() => hairlines(layout), [layout]);
  return (
    <group>
      <Shell geometry={parts.shell} spec={kit.wall} />
      <Shell geometry={parts.trim} spec={kit.trim} />
      <Line points={fine} segments color={kit.hairline} lineWidth={1} />
      <Line points={edges} segments color={kit.edge} lineWidth={1.1} />
    </group>
  );
}
