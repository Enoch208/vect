export type Quality = { occlusion: boolean; shadowMapSize: number; pixelRatio: number };

export const qualityLadder: readonly Quality[] = [
  { occlusion: true, shadowMapSize: 2048, pixelRatio: 1.75 },
  { occlusion: false, shadowMapSize: 2048, pixelRatio: 1.75 },
  { occlusion: false, shadowMapSize: 1024, pixelRatio: 1.75 },
  { occlusion: false, shadowMapSize: 1024, pixelRatio: 1 },
];

export const sampleRun = 40;
const slowestFrame = 1 / 45;
const longestGap = 0.1;

export function qualityAt(level: number): Quality {
  const last = qualityLadder.length - 1;
  return (
    qualityLadder[Math.min(last, Math.max(0, level))] ?? {
      occlusion: false,
      shadowMapSize: 1024,
      pixelRatio: 1,
    }
  );
}

export function isContinuous(delta: number): boolean {
  return delta > 0 && delta < longestGap;
}

export function shouldDecline(frameTimes: readonly number[]): boolean {
  if (frameTimes.length < sampleRun) return false;
  const sorted = [...frameTimes].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  return median > slowestFrame;
}
