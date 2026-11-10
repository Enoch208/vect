import { useFrame } from "@react-three/fiber";
import { EffectComposer, N8AO, SMAA, type OcclusionPass } from "@react-three/postprocessing";
import { useRef, type ReactElement } from "react";
import {
  FloatType,
  HalfFloatType,
  NearestFilter,
  RedFormat,
  RGBAFormat,
  WebGLRenderTarget,
} from "three";
import { useScene } from "./scene-context.js";

function halfResolutionTarget(width: number, height: number): WebGLRenderTarget {
  const target = new WebGLRenderTarget(width, height, { count: 2, depthBuffer: false });
  const [depth, normal] = target.textures;
  if (depth === undefined || normal === undefined) return target;
  depth.format = RedFormat;
  depth.type = FloatType;
  normal.format = RGBAFormat;
  normal.type = HalfFloatType;
  for (const texture of [depth, normal]) {
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
  }
  return target;
}

function useHalfResolutionRepair(): React.RefObject<OcclusionPass | null> {
  const pass = useRef<OcclusionPass | null>(null);
  useFrame(() => {
    const occlusion = pass.current;
    if (occlusion === null) return;
    occlusion.autoDetectTransparency = false;
    const stale = occlusion.depthDownsampleTarget;
    if (stale === null || !("isWebGLMultipleRenderTargets" in stale)) return;
    occlusion.depthDownsampleTarget = halfResolutionTarget(stale.width, stale.height);
    stale.dispose();
  });
  return pass;
}

export function Effects({ occlusion }: { occlusion: boolean }): ReactElement {
  const { kit } = useScene();
  const pass = useHalfResolutionRepair();
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {occlusion ? (
        <N8AO
          ref={pass}
          halfRes
          quality="medium"
          aoRadius={1.7}
          distanceFalloff={1}
          intensity={2.4}
          color={kit.ink}
        />
      ) : (
        <></>
      )}
      <SMAA />
    </EffectComposer>
  );
}
