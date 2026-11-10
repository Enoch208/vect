import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useCallback, useMemo, useRef, type ReactElement } from "react";
import { Scene } from "three";
import { actorAnchor } from "./anchors.js";
import { Architecture } from "./Architecture.js";
import { Avatar } from "./Avatar.js";
import { dims } from "./blocks.js";
import { CameraRig } from "./CameraRig.js";
import { cameraDistance, viewDirection } from "./camera-math.js";
import { Effects } from "./Effects.js";
import { Entities } from "./Entities.js";
import { Floors } from "./Floors.js";
import { Gates } from "./Gates.js";
import { Labels } from "./Labels.js";
import { layoutWorld } from "./layout.js";
import { Lighting } from "./Lighting.js";
import { pairTags } from "./pairing.js";
import { SceneContext, useScene, type SceneContextValue } from "./scene-context.js";
import { themeKit } from "./themes.js";
import type { WorldSceneProps } from "./types.js";
import { gateStates } from "./truth.js";
import { useWorldControls } from "./use-world-controls.js";

function FrameReport({ onFrame }: { onFrame: (frames: number, calls: number) => void }): null {
  useFrame((three) => {
    onFrame(three.gl.info.render.frame, three.gl.info.render.calls);
  });
  return null;
}

function Ground(): ReactElement {
  const { layout, kit } = useScene();
  const { bounds } = layout;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[
        (bounds.minX + bounds.maxX) / 2,
        -dims.plinthHeight,
        (bounds.minZ + bounds.maxZ) / 2,
      ]}
      receiveShadow
    >
      <planeGeometry args={[bounds.maxX - bounds.minX + 240, bounds.maxZ - bounds.minZ + 240]} />
      <shadowMaterial opacity={kit.lights.shadowOpacity} color={kit.ink} />
    </mesh>
  );
}

export function WorldScene(props: WorldSceneProps): ReactElement {
  const { world, state, actor, highlightIds, selectedEntityId, interactive, reducedMotion } = props;
  const container = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => layoutWorld(world), [world]);
  const overlay = useMemo(() => new Scene(), []);
  const scene = useMemo<SceneContextValue>(
    () => ({
      layout,
      kit: themeKit(world.theme),
      pairing: pairTags(world),
      reducedMotion,
      interactive,
      overlay,
    }),
    [layout, world, reducedMotion, interactive, overlay],
  );
  const anchor = useMemo(() => actorAnchor(world, layout, state), [world, layout, state]);
  const gates = useMemo(() => gateStates(world, state), [world, state]);
  const openConnectionIds = useMemo(
    () => new Set([...gates].filter(([, gate]) => gate !== "closed").map(([id]) => id)),
    [gates],
  );
  const report = useCallback((frames: number, calls: number) => {
    const node = container.current;
    if (node === null) return;
    node.dataset["worldScene"] = "ready";
    node.dataset["frames"] = String(frames);
    node.dataset["calls"] = String(calls);
  }, []);
  useWorldControls(props, layout);
  return (
    <div
      ref={container}
      data-world-scene="loading"
      data-actor-room={state.currentRoomId}
      style={{ width: "100%", height: "100%", background: scene.kit.paper, touchAction: "none" }}
    >
      <Canvas
        frameloop="demand"
        orthographic
        flat
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{
          near: 1,
          far: cameraDistance * 3,
          zoom: 20,
          position: [
            viewDirection[0] * cameraDistance,
            viewDirection[1] * cameraDistance,
            viewDirection[2] * cameraDistance,
          ],
        }}
        onPointerMissed={() => {
          if (interactive) props.onSelect(null);
        }}
      >
        <color attach="background" args={[scene.kit.paper]} />
        <SceneContext value={scene}>
          <Suspense fallback={null}>
            <Lighting shadowMapSize={2048} />
            <Ground />
            <Architecture />
            <Floors currentRoomId={state.currentRoomId} onMoveTo={props.onMoveTo} />
            <Gates
              gates={gates}
              currentRoomId={state.currentRoomId}
              highlightIds={highlightIds}
              onMoveTo={props.onMoveTo}
            />
            <Entities
              world={world}
              state={state}
              highlightIds={highlightIds}
              selectedEntityId={selectedEntityId}
              onInteract={props.onInteract}
              onSelect={props.onSelect}
            />
            <Avatar
              anchor={anchor}
              state={state}
              openConnectionIds={openConnectionIds}
              actor={actor}
            />
            <Labels
              world={world}
              state={state}
              highlightIds={highlightIds}
              selectedEntityId={selectedEntityId}
            />
            <CameraRig focus={anchor} />
            <Effects occlusion={!reducedMotion} />
            <FrameReport onFrame={report} />
          </Suspense>
        </SceneContext>
      </Canvas>
    </div>
  );
}
