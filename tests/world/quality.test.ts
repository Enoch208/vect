import { describe, expect, it } from "vitest";
import {
  isContinuous,
  qualityAt,
  qualityLadder,
  sampleRun,
  shouldDecline,
} from "../../src/components/world/quality.js";

const run = (frameTime: number) => Array.from({ length: sampleRun }, () => frameTime);

describe("quality ladder", () => {
  it("drops ambient occlusion first, then shadow resolution, then pixel ratio", () => {
    const [full, first, second, third] = qualityLadder;
    expect(full).toEqual({ occlusion: true, shadowMapSize: 2048, pixelRatio: 1.75 });
    expect(first?.occlusion).toBe(false);
    expect(first?.shadowMapSize).toBe(full?.shadowMapSize);
    expect(second?.shadowMapSize).toBeLessThan(first?.shadowMapSize ?? 0);
    expect(second?.pixelRatio).toBe(first?.pixelRatio);
    expect(third?.pixelRatio).toBe(1);
  });

  it("stays on the last rung when asked for more", () => {
    expect(qualityAt(99)).toEqual(qualityLadder.at(-1));
    expect(qualityAt(-3)).toEqual(qualityLadder[0]);
  });

  it("declines only on a full run of frames slower than 45 per second", () => {
    expect(shouldDecline(run(1 / 60))).toBe(false);
    expect(shouldDecline(run(1 / 30))).toBe(true);
    expect(shouldDecline(run(1 / 30).slice(1))).toBe(false);
  });

  it("ignores the long gap after an idle scene wakes up", () => {
    expect(isContinuous(1 / 60)).toBe(true);
    expect(isContinuous(2.5)).toBe(false);
    expect(shouldDecline([...run(1 / 60).slice(3), 0.05, 0.05, 0.05])).toBe(false);
  });
});
