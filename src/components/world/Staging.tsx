import { AdaptiveDpr, PerformanceMonitor, type PerformanceMonitorApi } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { Effects } from "./Effects.js";
import {
  createFrameSamples,
  recordFrame,
  summarizeFrames,
  type FrameSummary,
} from "./frame-stats.js";
import { Lighting } from "./Lighting.js";
import { qualityAt, qualityLadder } from "./quality.js";
import { useScene } from "./scene-context.js";

export type FrameStats = FrameSummary & {
  frames: number;
  calls: number;
  quality: number;
  delta: number;
  continuous: boolean;
};

const monitorWindowMs = 250;
const monitorIterations = 3;
const monitorSeconds = (monitorWindowMs * monitorIterations) / 1000;

export function Staging({ onFrame }: { onFrame: (stats: FrameStats) => void }): ReactElement {
  const { reducedMotion } = useScene();
  const [level, setLevel] = useState(0);
  const quality = qualityAt(level);
  const set = useThree((three) => three.set);
  const maxDpr = useThree((three) => three.viewport.initialDpr);
  const samples = useRef(createFrameSamples());
  const scheduled = useRef(false);
  const activeSeconds = useRef(0);
  const monitor = useRef<PerformanceMonitorApi | null>(null);

  useEffect(() => {
    const factor = Math.min(maxDpr, quality.pixelRatio) / maxDpr;
    set((three) => ({
      performance: { ...three.performance, current: factor, min: factor, max: factor },
    }));
  }, [set, maxDpr, quality.pixelRatio]);

  useFrame((three, delta) => {
    three.gl.info.autoReset = false;
    three.gl.info.reset();
    if (scheduled.current) {
      activeSeconds.current += delta;
      return;
    }
    activeSeconds.current = 0;
    const api = monitor.current;
    if (api === null) return;
    api.frames = [];
    api.averages = [];
    api.index = 0;
  }, -2);

  useFrame((three, delta) => {
    const { render } = three.gl.info;
    recordFrame(samples.current, {
      delta,
      continuous: scheduled.current,
      calls: render.calls,
    });
    onFrame({
      ...summarizeFrames(samples.current),
      frames: render.frame,
      calls: render.calls,
      quality: level,
      delta,
      continuous: scheduled.current,
    });
    scheduled.current = three.internal.frames > 1;
  }, 3);

  const observe = (api: PerformanceMonitorApi): void => {
    monitor.current = api;
  };

  return (
    <>
      <PerformanceMonitor
        ms={monitorWindowMs}
        iterations={monitorIterations}
        bounds={() => [45, 65]}
        onChange={observe}
        onIncline={observe}
        onDecline={(api) => {
          observe(api);
          if (activeSeconds.current < monitorSeconds) return;
          setLevel((previous) => Math.min(previous + 1, qualityLadder.length - 1));
        }}
      />
      <AdaptiveDpr />
      <Lighting shadowMapSize={quality.shadowMapSize} />
      {!reducedMotion && <Effects occlusion={quality.occlusion} />}
    </>
  );
}
