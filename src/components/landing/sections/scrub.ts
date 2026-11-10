type Point = readonly [number, number];

export function nearestProgress(points: readonly Point[], target: Point): number {
  let best = { progress: 0, distance: Number.POSITIVE_INFINITY };
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    if (from === undefined || to === undefined) continue;
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = dx * dx + dz * dz;
    const t =
      length === 0
        ? 0
        : Math.max(
            0,
            Math.min(1, ((target[0] - from[0]) * dx + (target[1] - from[1]) * dz) / length),
          );
    const x = from[0] + dx * t - target[0];
    const z = from[1] + dz * t - target[1];
    const distance = x * x + z * z;
    if (distance < best.distance) best = { progress: index + t, distance };
  }
  return best.progress;
}
