import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { Effects } from "./Effects.js";
import { Lighting } from "./Lighting.js";
import { isContinuous, qualityAt, qualityLadder, sampleRun, shouldDecline } from "./quality.js";
import { useScene } from "./scene-context.js";

export type FrameStats = { frames: number; calls: number; quality: number };

export function Staging({ onFrame }: { onFrame: (stats: FrameStats) => void }): ReactElement {
  const { reducedMotion } = useScene();
  const [level, setLevel] = useState(0);
  const quality = qualityAt(level);
  const setDpr = useThree((three) => three.setDpr);
  const maxDpr = useThree((three) => three.viewport.initialDpr);
  const run = useRef<number[]>([]);

  useEffect(() => {
    setDpr(Math.min(maxDpr, quality.pixelRatio));
  }, [setDpr, maxDpr, quality.pixelRatio]);

  useFrame((three, delta) => {
    const info = three.gl.info;
    onFrame({ frames: info.render.frame, calls: info.render.calls, quality: level });
    info.autoReset = false;
    info.reset();
    if (!isContinuous(delta)) {
      run.current = [];
      return;
    }
    run.current.push(delta);
    if (run.current.length < sampleRun) return;
    const slow = shouldDecline(run.current);
    run.current = [];
    if (slow && level < qualityLadder.length - 1) setLevel(level + 1);
  }, -1);

  return (
    <>
      <Lighting shadowMapSize={quality.shadowMapSize} />
      <Effects occlusion={quality.occlusion && !reducedMotion} />
    </>
  );
}
