export const worldLimits = {
  rooms: { min: 4, max: 10 },
  connections: { min: 3, max: 15 },
  entities: { min: 1, max: 40 },
  gridExtent: 10,
  labelLength: 60,
  titleLength: 80,
  promptLength: { min: 10, max: 1000 },
  adaptations: 10,
  exprDepth: 5,
  exprPredicates: 16,
  patchOperations: 8,
  waitTicks: 10,
  selectedEntities: 10,
  repairAttempts: 3,
} as const;

export const kindLimits = {
  key: 3,
  door: 3,
  switch: 3,
  barrier: 3,
  chest: 3,
  trap: 3,
  portal: 2,
  checkpoint: 3,
  goal: 1,
  prop: 12,
} as const;
