import type { ReactElement } from "react";
import { BackSide } from "three";
import { Cluster } from "./Cluster.js";
import { agentBody, playerBody, playerShell } from "./entity-parts.js";
import { Flat } from "./paint.js";
import { useScene } from "./scene-context.js";

function FloorRing({ color }: { color: string }): ReactElement {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.56, 0.66, 48]} />
      <Flat color={color} />
    </mesh>
  );
}

function PlayerFigure(): ReactElement {
  const { kit } = useScene();
  return (
    <group>
      <FloorRing color={kit.ink} />
      <Cluster parts={playerBody}>
        <meshStandardMaterial color={kit.paper} roughness={0.8} />
      </Cluster>
      <Cluster parts={playerShell} shadow={false}>
        <meshBasicMaterial color={kit.ink} side={BackSide} toneMapped={false} />
      </Cluster>
      <mesh position={[0, 1.78, 0.2]}>
        <boxGeometry args={[0.3, 0.08, 0.14]} />
        <Flat color={kit.ink} />
      </mesh>
    </group>
  );
}

function AgentFigure(): ReactElement {
  const { kit } = useScene();
  return (
    <group>
      <FloorRing color={kit.ink} />
      <Cluster parts={agentBody}>
        <meshStandardMaterial color={kit.ink} roughness={0.55} flatShading />
      </Cluster>
      <mesh position={[0, 1.28, 0.2]}>
        <sphereGeometry args={[0.1, 14, 10]} />
        <Flat color={kit.accent} />
      </mesh>
    </group>
  );
}

export function Figure({ actor }: { actor: "player" | "agent" }): ReactElement {
  return actor === "player" ? <PlayerFigure /> : <AgentFigure />;
}
