import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useMemo, useRef, type ReactElement } from "react";
import { Scene } from "three";
import { AgentPath } from "./AgentPath.js";
import { actorAnchor } from "./anchors.js";
import { Architecture } from "./Architecture.js";
import { actorHeight, actorName, Avatar } from "./Avatar.js";
import { dims } from "./blocks.js";
import { CameraRig } from "./CameraRig.js";
import { cameraDistance, viewDirection } from "./camera-math.js";
import { Entities } from "./Entities.js";
import { Floors } from "./Floors.js";
import { Gates } from "./Gates.js";
import { Labels } from "./Labels.js";
import { layoutWorld } from "./layout.js";
import { pairTags } from "./pairing.js";
import { Props } from "./Props.js";
import { SceneContext, useScene, type SceneContextValue } from "./scene-context.js";
import { Staging, type FrameStats } from "./Staging.js";
import { themeKit } from "./themes.js";
import type { WorldSceneProps } from "./types.js";
import { gateStates } from "./truth.js";
import { useWorldControls } from "./use-world-controls.js";

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
  const chip = useMemo(() => {
    const at: [number, number, number] = [anchor[0], actorHeight[actor], anchor[1]];
    return { anchor: at, text: actorName[actor] };
  }, [anchor, actor]);
  const gates = useMemo(() => gateStates(world, state), [world, state]);
  const openConnectionIds = useMemo(
    () => new Set([...gates].filter(([, gate]) => gate !== "closed").map(([id]) => id)),
    [gates],
  );
  const report = useCallback((stats: FrameStats) => {
    const node = container.current;
    if (node === null) return;
    node.dataset["worldScene"] = "ready";
    node.dataset["frames"] = String(stats.frames);
    node.dataset["quality"] = String(stats.quality);
    node.dataset["sceneFrames"] = String(stats.sceneFrames);
    node.dataset["calls"] = String(stats.calls);
    node.dataset["maxCalls"] = String(stats.maxCalls);
    node.dataset["activeSamples"] = String(stats.activeSamples);
    node.dataset["frameDelta"] = String(stats.delta);
    node.dataset["frameContinuous"] = String(stats.continuous);
    if (stats.fps !== null) node.dataset["fps"] = String(stats.fps);
    if (stats.fpsMin !== null) node.dataset["fpsMin"] = String(stats.fpsMin);
    if (stats.fpsP5 !== null) node.dataset["fpsP5"] = String(stats.fpsP5);
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
        shadows="percentage"
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
        <fog attach="fog" args={[scene.kit.fog.color, scene.kit.fog.near, scene.kit.fog.far]} />
        <SceneContext value={scene}>
          <Suspense fallback={null}>
            <Staging onFrame={report} />
            <Ground />
            <Architecture />
            <Floors currentRoomId={state.currentRoomId} onMoveTo={props.onMoveTo} />
            <Gates
              world={world}
              gates={gates}
              currentRoomId={state.currentRoomId}
              highlightIds={highlightIds}
              onMoveTo={props.onMoveTo}
            />
            <Props world={world} onSelect={props.onSelect} />
            <AgentPath world={world} path={props.path} />
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
              actor={chip}
            />
            <CameraRig focus={anchor} />
          </Suspense>
        </SceneContext>
      </Canvas>
    </div>
  );
}
