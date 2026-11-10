import { Edges } from "@react-three/drei";
import type { ReactElement } from "react";
import { useScene } from "./scene-context.js";

export type Tone = "white" | "tint" | "fixture";

export function Matte({ tone = "white" }: { tone?: Tone }): ReactElement {
  const { kit } = useScene();
  const spec = tone === "white" ? kit.wall : tone === "tint" ? kit.trim : kit.fixture;
  return (
    <meshStandardMaterial
      color={spec.color}
      roughness={spec.roughness}
      metalness={spec.metalness}
      polygonOffset
      polygonOffsetFactor={1}
      polygonOffsetUnits={1}
    />
  );
}

export function Flat({ color }: { color: string }): ReactElement {
  return (
    <meshBasicMaterial
      color={color}
      toneMapped={false}
      polygonOffset
      polygonOffsetFactor={1}
      polygonOffsetUnits={1}
    />
  );
}

export function InkEdges({ strong = false }: { strong?: boolean }): ReactElement {
  const { kit } = useScene();
  return <Edges color={strong ? kit.ink : kit.edge} lineWidth={1.1} threshold={28} />;
}
