import { describe, expect, it } from "vitest";
import { pickOne, seededRandom } from "../../src/domain/random.js";

describe("seededRandom", () => {
  it("gives the same first three values twice for the same seed", () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect(new Set(first).size).toBe(3);
  });

  it("stays in [0, 1) and differs across seeds", () => {
    const values = Array.from({ length: 200 }, seededRandom(1));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });

  it("pickOne draws only on a real tie", () => {
    const random = seededRandom(3);
    expect(pickOne(random, ["only"])).toBe("only");
    expect(pickOne(random, [])).toBeNull();
    const untouched = seededRandom(3);
    expect(random()).toBe(untouched());
  });
});
