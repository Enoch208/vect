export function seededRandom(seed: number): () => number {
  let current = seed >>> 0;
  return () => {
    current = (current + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(current ^ (current >>> 15), current | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function pickOne<T>(random: () => number, items: readonly T[]): T | null {
  if (items.length <= 1) return items[0] ?? null;
  return items[Math.floor(random() * items.length)] ?? null;
}
