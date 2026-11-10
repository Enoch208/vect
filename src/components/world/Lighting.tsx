import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useRef, type ReactElement } from "react";
import type { DirectionalLight } from "three";
import { useScene } from "./scene-context.js";

const lightDistance = 90;

function LightingRig({ shadowMapSize }: { shadowMapSize: number }): ReactElement {
  const { layout, kit } = useScene();
  const { bounds } = layout;
  const light = useRef<DirectionalLight>(null);
  const rebake = useRef(true);
  const invalidate = useThree((three) => three.invalidate);
  const centre: [number, number] = [
    (bounds.minX + bounds.maxX) / 2,
    (bounds.minZ + bounds.maxZ) / 2,
  ];
  const reach = Math.hypot(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2 + 6;
  const [dx, dy, dz] = kit.lights.keyDirection;
  const length = Math.hypot(dx, dy, dz);
  const [cx, cz] = centre;

  useEffect(() => {
    const lamp = light.current;
    if (lamp === null) return;
    const shadowMap = lamp.shadow.map;
    if (shadowMap !== null && shadowMap.width !== shadowMapSize) {
      shadowMap.dispose();
      lamp.shadow.map = null;
    }
    lamp.target.position.set(cx, 0, cz);
    lamp.target.updateMatrixWorld();
    lamp.shadow.camera.left = -reach;
    lamp.shadow.camera.right = reach;
    lamp.shadow.camera.top = reach;
    lamp.shadow.camera.bottom = -reach;
    lamp.shadow.camera.near = 1;
    lamp.shadow.camera.far = lightDistance * 2 + reach;
    lamp.shadow.camera.updateProjectionMatrix();
    lamp.shadow.needsUpdate = true;
    rebake.current = true;
    invalidate();
  }, [cx, cz, reach, shadowMapSize, kit, layout, invalidate]);

  useFrame((three) => {
    three.gl.shadowMap.autoUpdate = false;
    if (!rebake.current) return;
    three.gl.shadowMap.needsUpdate = true;
    rebake.current = false;
  });

  return (
    <>
      <hemisphereLight
        args={[kit.lights.skyColor, kit.lights.groundColor, kit.lights.hemisphereIntensity]}
      />
      <directionalLight
        ref={light}
        castShadow
        color={kit.lights.keyColor}
        intensity={kit.lights.keyIntensity}
        position={[
          cx + (dx / length) * lightDistance,
          (dy / length) * lightDistance,
          cz + (dz / length) * lightDistance,
        ]}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
        shadow-radius={5}
      />
      <directionalLight
        color={kit.lights.fillColor}
        intensity={kit.lights.fillIntensity}
        position={[cx + 40, 30, cz - 10]}
      />
      <Environment
        resolution={64}
        frames={1}
        environmentIntensity={kit.lights.environmentIntensity}
      >
        <color attach="background" args={[kit.lights.groundColor]} />
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[-6, 9, 5]}
          scale={[14, 14, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          position={[9, 4, -6]}
          scale={[10, 8, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="ring"
          intensity={1.2}
          position={[0, 12, 0]}
          scale={8}
          target={[0, 0, 0]}
        />
      </Environment>
    </>
  );
}

export const Lighting = memo(LightingRig);
