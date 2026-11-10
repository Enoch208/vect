import { Outlines } from "@react-three/drei";
import type { ReactElement } from "react";
import { useScene } from "./scene-context.js";

function FloorRing({ color }: { color: string }): ReactElement {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.56, 0.66, 48]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function PlayerFigure(): ReactElement {
  const { kit } = useScene();
  return (
    <group>
      <FloorRing color={kit.ink} />
      <mesh position={[0, 0.78, 0]} castShadow>
        <capsuleGeometry args={[0.31, 0.7, 6, 20]} />
        <meshStandardMaterial color={kit.paper} roughness={0.8} />
        <Outlines thickness={0.055} color={kit.ink} />
      </mesh>
      <mesh position={[0, 1.76, 0]} castShadow>
        <sphereGeometry args={[0.26, 24, 18]} />
        <meshStandardMaterial color={kit.paper} roughness={0.8} />
        <Outlines thickness={0.055} color={kit.ink} />
      </mesh>
      <mesh position={[0, 1.78, 0.2]}>
        <boxGeometry args={[0.3, 0.08, 0.14]} />
        <meshBasicMaterial color={kit.ink} toneMapped={false} />
      </mesh>
    </group>
  );
}

function AgentFigure(): ReactElement {
  const { kit } = useScene();
  return (
    <group>
      <FloorRing color={kit.ink} />
      <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.4, 1, 4]} />
        <meshStandardMaterial color={kit.ink} roughness={0.55} flatShading />
      </mesh>
      <mesh position={[0, 1.28, 0]} castShadow>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={kit.ink} roughness={0.55} flatShading />
      </mesh>
      <mesh position={[0, 1.28, 0.2]}>
        <sphereGeometry args={[0.1, 14, 10]} />
        <meshBasicMaterial color={kit.accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Figure({ actor }: { actor: "player" | "agent" }): ReactElement {
  return actor === "player" ? <PlayerFigure /> : <AgentFigure />;
}
