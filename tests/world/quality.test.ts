import { describe, expect, it } from "vitest";
import { qualityAt, qualityLadder } from "../../src/components/world/quality.js";
import {
  createFrameSamples,
  recordFrame,
  summarizeFrames,
} from "../../src/components/world/frame-stats.js";

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
});

describe("frame measurements", () => {
  it("excludes idle wakeups but retains slow frames during a scheduled animation", () => {
    const samples = createFrameSamples();
    recordFrame(samples, { delta: 2.5, continuous: false, calls: 10 });
    expect(summarizeFrames(samples).fps).toBeNull();
    recordFrame(samples, { delta: 1 / 60, continuous: true, calls: 20 });
    recordFrame(samples, { delta: 0.2, continuous: true, calls: 30 });
    expect(summarizeFrames(samples)).toMatchObject({ activeSamples: 2, fpsMin: 5 });
  });

  it("records every scene frame and draw-call peak without confusing render passes with frames", () => {
    const samples = createFrameSamples();
    for (const calls of [50, 175, 60]) {
      recordFrame(samples, { delta: 1 / 60, continuous: true, calls });
    }
    expect(summarizeFrames(samples)).toMatchObject({
      sceneFrames: 3,
      maxCalls: 175,
      activeSamples: 3,
      fps: 60,
      fpsMin: 60,
      fpsP5: 60,
    });
  });

  it("keeps actual minimum distinct from the fifth percentile and median", () => {
    const samples = createFrameSamples();
    for (let index = 0; index < 100; index += 1) {
      const fps = index === 0 ? 10 : index < 10 ? 30 : 60;
      recordFrame(samples, { delta: 1 / fps, continuous: true, calls: 1 });
    }
    expect(summarizeFrames(samples)).toMatchObject({ fpsMin: 10, fpsP5: 30, fps: 60 });
  });

  it("bounds retained frame times during long sessions", () => {
    const samples = createFrameSamples();
    for (let index = 0; index < 8000; index += 1) {
      recordFrame(samples, { delta: 1 / 60, continuous: true, calls: 1 });
    }
    expect(samples.times.length).toBeLessThanOrEqual(7200);
    expect(summarizeFrames(samples)).toMatchObject({ sceneFrames: 8000, activeSamples: 7200 });
  });
});
