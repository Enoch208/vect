export type Quality = { occlusion: boolean; shadowMapSize: number; pixelRatio: number };

export const qualityLadder: readonly Quality[] = [
  { occlusion: true, shadowMapSize: 2048, pixelRatio: 1.75 },
  { occlusion: false, shadowMapSize: 2048, pixelRatio: 1.75 },
  { occlusion: false, shadowMapSize: 1024, pixelRatio: 1.75 },
  { occlusion: false, shadowMapSize: 1024, pixelRatio: 1 },
];

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
