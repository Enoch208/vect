import { describe, expect, it } from "vitest";
import { themes } from "../../src/contract/codes.js";
import { architectureBlocks, dims } from "../../src/components/world/blocks.js";
import { layoutWorld } from "../../src/components/world/layout.js";
import { themeBlocks } from "../../src/components/world/theme-detail.js";
import { themeKit } from "../../src/components/world/themes.js";
import { observatory } from "../../src/fixtures/observatory.js";
import { tenRoomTemple } from "../../src/fixtures/suite-large.js";

describe("theme architecture", () => {
  it("gives every theme its own detail", () => {
    const details = themes.map((theme) => themeKit(theme).detail);
    expect(new Set(details).size).toBe(themes.length);
  });

  it("adds decoration without touching the structure or the layout", () => {
    for (const world of [observatory, tenRoomTemple]) {
      const layout = layoutWorld(world);
      const structure = architectureBlocks(layout);
      const before = JSON.stringify(structure);
      for (const theme of themes) {
        const extra = themeBlocks(layout, structure, themeKit(theme).detail);
        expect(extra.length, theme).toBeGreaterThan(0);
        expect(JSON.stringify(structure)).toBe(before);
        expect(layoutWorld({ ...world, theme })).toEqual(layout);
      }
    }
  });

  it("keeps decoration on top of the tall walls or around the base, never in a doorway", () => {
    const layout = layoutWorld(tenRoomTemple);
    const structure = architectureBlocks(layout);
    for (const theme of themes) {
      for (const block of themeBlocks(layout, structure, themeKit(theme).detail)) {
        const bottom = block.center[1] - block.size[1] / 2;
        const top = block.center[1] + block.size[1] / 2;
        const onWall = bottom >= dims.wallHeight - 0.001;
        const atBase = top <= -dims.bridgeHeight - 0.02;
        expect(onWall || atBase, `${theme} at ${String(block.center[1])}`).toBe(true);
        const room = layout.rooms.find(
          (item) =>
            Math.abs(block.center[0] - item.center[0]) <= item.size / 2 + 0.6 &&
            Math.abs(block.center[2] - item.center[1]) <= item.size / 2 + 0.6,
        );
        expect(room, `${theme} block outside every room`).toBeDefined();
      }
    }
  });
});
