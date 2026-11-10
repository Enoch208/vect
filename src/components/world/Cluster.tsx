import type { ReactElement, ReactNode } from "react";
import { clusterGeometry } from "./part-geometry.js";
import type { Part } from "./parts.js";

type ClusterProps = {
  parts: readonly Part[];
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  shadow?: boolean;
};

export function Cluster(props: ClusterProps): ReactElement {
  const { parts, children, position = [0, 0, 0], rotation = [0, 0, 0], shadow = false } = props;
  return (
    <mesh
      geometry={clusterGeometry(parts)}
      position={position}
      rotation={rotation}
      castShadow={shadow}
      receiveShadow={shadow}
    >
      {children}
    </mesh>
  );
}
