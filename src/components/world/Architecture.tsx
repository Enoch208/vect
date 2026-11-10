import { Line } from "@react-three/drei";
import { useEffect, useMemo, type ReactElement } from "react";
import { BoxGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { architectureBlocks, blockEdges, type Block, type BlockPart } from "./blocks.js";
import { useScene } from "./scene-context.js";
import type { MaterialSpec } from "./themes.js";

function mergeBlocks(blocks: readonly Block[]): BufferGeometry | null {
  if (blocks.length === 0) return null;
  const boxes = blocks.map((block) => new BoxGeometry(...block.size).translate(...block.center));
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
  const blocks = useMemo(() => architectureBlocks(layout), [layout]);
  const parts = useMemo(() => {
    const of = (wanted: readonly BlockPart[]) =>
      mergeBlocks(blocks.filter((block) => wanted.includes(block.part)));
    return { base: of(["plinth", "bridge"]), walls: of(["wall"]), trim: of(["frame", "rail"]) };
  }, [blocks]);
  const edges = useMemo(() => blocks.flatMap(blockEdges), [blocks]);
  return (
    <group>
      <Shell geometry={parts.base} spec={kit.plinth} />
      <Shell geometry={parts.walls} spec={kit.wall} />
      <Shell geometry={parts.trim} spec={kit.trim} />
      <Line points={edges} segments color={kit.edge} lineWidth={1.1} />
    </group>
  );
}
