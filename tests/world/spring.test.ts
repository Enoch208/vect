import { describe, expect, it } from "vitest";
import {
  clunk,
  glide,
  settle,
  snapSpring,
  stepSpring,
  type Spring,
} from "../../src/components/world/spring.js";

function run(spring: Spring, target: number, frame: number, frames: number, config = settle) {
  let resting = false;
  let peak = spring.value;
  for (let index = 0; index < frames && !resting; index += 1) {
    resting = stepSpring(spring, target, frame, config);
    peak = Math.max(peak, spring.value);
  }
  return { resting, peak };
}

describe("stepSpring", () => {
  it("settles exactly on its target and reports rest", () => {
    const spring = { value: 0, velocity: 0 };
    const { resting } = run(spring, 1.72, 1 / 60, 240);
    expect(resting).toBe(true);
    expect(spring).toEqual({ value: 1.72, velocity: 0 });
  });

  it("overshoots a little when it clunks and never when it glides", () => {
    expect(run({ value: 0, velocity: 0 }, 1, 1 / 60, 240, clunk).peak).toBeGreaterThan(1.01);
    expect(run({ value: 0, velocity: 0 }, 1, 1 / 60, 600, glide).peak).toBeLessThanOrEqual(1.001);
  });

  it("keeps real-time pace and stays stable on slow frames", () => {
    const fast = { value: 0, velocity: 0 };
    const slow = { value: 0, velocity: 0 };
    run(fast, 1, 1 / 60, 30);
    run(slow, 1, 1 / 10, 5);
    expect(Math.abs(fast.value - slow.value)).toBeLessThan(0.05);
    const stalled = { value: 0, velocity: 0 };
    stepSpring(stalled, 1, 5, settle);
    expect(Number.isFinite(stalled.value)).toBe(true);
    expect(stalled.value).toBeLessThan(1.5);
  });

  it("snaps without motion", () => {
    const spring = { value: 0.3, velocity: 4 };
    snapSpring(spring, 1);
    expect(spring).toEqual({ value: 1, velocity: 0 });
    expect(stepSpring(spring, 1, 1 / 60, settle)).toBe(true);
  });
});
