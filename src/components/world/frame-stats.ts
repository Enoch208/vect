const retainedSamples = 7200;

type FrameSample = { delta: number; continuous: boolean; calls: number };

export type FrameSamples = {
  frames: number;
  maxCalls: number;
  times: number[];
  sorted: number[];
};

export type FrameSummary = {
  sceneFrames: number;
  maxCalls: number;
  activeSamples: number;
  fps: number | null;
  fpsMin: number | null;
  fpsP5: number | null;
};

export function createFrameSamples(): FrameSamples {
  return { frames: 0, maxCalls: 0, times: [], sorted: [] };
}

function insertionIndex(sorted: readonly number[], value: number): number {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if ((sorted[middle] ?? Infinity) < value) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function recordFrame(samples: FrameSamples, frame: FrameSample): void {
  samples.frames += 1;
  samples.maxCalls = Math.max(samples.maxCalls, frame.calls);
  if (!frame.continuous || frame.delta <= 0 || !Number.isFinite(frame.delta)) return;
  samples.times.push(frame.delta);
  samples.sorted.splice(insertionIndex(samples.sorted, frame.delta), 0, frame.delta);
  if (samples.times.length <= retainedSamples) return;
  const removed = samples.times.shift();
  if (removed !== undefined) samples.sorted.splice(insertionIndex(samples.sorted, removed), 1);
}

function rateAt(sorted: readonly number[], quantile: number): number | null {
  const index = Math.max(0, Math.ceil(sorted.length * quantile) - 1);
  const time = sorted[index];
  return time === undefined ? null : Math.round(10 / time) / 10;
}

export function summarizeFrames(samples: FrameSamples): FrameSummary {
  return {
    sceneFrames: samples.frames,
    maxCalls: samples.maxCalls,
    activeSamples: samples.times.length,
    fps: rateAt(samples.sorted, 0.5),
    fpsMin: rateAt(samples.sorted, 1),
    fpsP5: rateAt(samples.sorted, 0.95),
  };
}
