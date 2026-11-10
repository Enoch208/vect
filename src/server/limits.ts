import { HttpFailure } from "./http.js";

const hourMs = 60 * 60 * 1000;

export interface Lease {
  release(): void;
}

export function createLimiter(options: {
  perHour: number;
  maxConcurrent: number;
  now: () => number;
}): { admit(ip: string): Lease } {
  const hits = new Map<string, number[]>();
  let active = 0;

  return {
    admit(ip) {
      const now = options.now();
      prune(hits, now);
      const recent = hits.get(ip) ?? [];
      if (recent.length >= options.perHour) {
        throw new HttpFailure(
          429,
          "RATE_LIMITED",
          true,
          "Wait and retry.",
          "Too many requests from this address.",
        );
      }
      if (active >= options.maxConcurrent) {
        throw new HttpFailure(
          429,
          "RATE_LIMITED",
          true,
          "Wait for a running generation to finish.",
          "Too many generations are running.",
        );
      }
      hits.set(ip, [...recent, now]);
      active += 1;
      let open = true;
      return {
        release() {
          if (!open) return;
          open = false;
          active -= 1;
        },
      };
    },
  };
}

function prune(hits: Map<string, number[]>, now: number): void {
  for (const [ip, stamps] of hits) {
    const recent = stamps.filter((at) => now - at < hourMs);
    if (recent.length === 0) hits.delete(ip);
    else hits.set(ip, recent);
  }
}
