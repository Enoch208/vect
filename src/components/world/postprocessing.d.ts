import type { ReactElement, ReactNode, Ref } from "react";
import type { WebGLRenderTarget } from "three";

declare module "@react-three/postprocessing" {
  export type OcclusionPass = {
    depthDownsampleTarget: WebGLRenderTarget | null;
    autoDetectTransparency: boolean;
  };

  export function EffectComposer(props: {
    children: ReactNode;
    enabled?: boolean;
    multisampling?: number;
    enableNormalPass?: boolean;
    depthBuffer?: boolean;
    stencilBuffer?: boolean;
    resolutionScale?: number;
  }): ReactElement | null;

  export function N8AO(props: {
    enabled?: boolean;
    aoRadius?: number;
    distanceFalloff?: number;
    intensity?: number;
    quality?: "performance" | "low" | "medium" | "high" | "ultra";
    aoSamples?: number;
    denoiseSamples?: number;
    denoiseRadius?: number;
    color?: string;
    halfRes?: boolean;
    depthAwareUpsampling?: boolean;
    screenSpaceRadius?: boolean;
    ref?: Ref<OcclusionPass>;
  }): ReactElement;

  export function SMAA(props: { opacity?: number }): ReactElement;
}
