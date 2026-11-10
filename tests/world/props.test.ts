import { describe, expect, it } from "vitest";
import { themes } from "../../src/contract/codes.js";
import { layoutWorld } from "../../src/components/world/layout.js";
import { partReach, propLimits } from "../../src/components/world/parts.js";
import { propSet, propVariant, propVariants } from "../../src/components/world/props/index.js";
import { themeKit } from "../../src/components/world/themes.js";
import { entity } from "../../src/fixtures/build.js";
import { observatory } from "../../src/fixtures/observatory.js";

const slack = 0.03;

describe("theme kits", () => {
  it("every theme defines every slot", () => {
    for (const theme of themes) {
      const kit = themeKit(theme);
      for (const spec of [kit.plinth, kit.floor, kit.wall, kit.trim, kit.fixture]) {
        expect(spec.color).toMatch(/^#[0-9A-F]{6}$/i);
        expect(spec.roughness).toBeGreaterThan(0);
      }
      for (const color of [
        kit.accent,
        kit.gateClosed,
        kit.gateOpen,
        kit.ink,
        kit.edge,
        kit.paper,
      ]) {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      }
      expect(kit.fog.far).toBeGreaterThan(kit.fog.near);
      expect(kit.lights.keyIntensity).toBeGreaterThan(0);
    }
  });

  it("prop variants are non-empty", () => {
    for (const theme of themes) {
      expect(themeKit(theme).propVariants.length).toBeGreaterThan(0);
      expect(themeKit(theme).propVariants).toEqual(propVariants(theme));
    }
  });

  it("switching theme changes no layout coordinates", () => {
    const base = layoutWorld(observatory);
    for (const theme of themes) {
      expect(layoutWorld({ ...observatory, theme })).toEqual(base);
    }
  });

  it("keeps the same gameplay colours in every theme", () => {
    const [first, ...rest] = themes.map(themeKit);
    for (const kit of rest) {
      expect(kit.accent).toBe(first?.accent);
      expect(kit.gateClosed).toBe(first?.gateClosed);
      expect(kit.gateOpen).toBe(first?.gateOpen);
      expect(kit.paper).toBe(first?.paper);
    }
  });
});

describe("prop sets", () => {
  it("every variant is built from several parts and stays inside its footprint", () => {
    for (const theme of themes) {
      for (const [name, parts] of Object.entries(propSet(theme).variants)) {
        expect(parts.length, `${theme}/${name}`).toBeGreaterThanOrEqual(3);
        for (const part of parts) {
          const reach = partReach(part);
          expect(reach.radius, `${theme}/${name} radius`).toBeLessThanOrEqual(
            propLimits.radius + slack,
          );
          expect(reach.top, `${theme}/${name} height`).toBeLessThanOrEqual(
            propLimits.height + slack,
          );
          expect(part.at[1], `${theme}/${name} floor`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("every keyword list names a variant that exists", () => {
    for (const theme of themes) {
      const set = propSet(theme);
      for (const name of Object.keys(set.keywords)) {
        expect(Object.keys(set.variants), `${theme}/${name}`).toContain(name);
      }
    }
  });

  it("picks a variant by name, then by label keyword, then by position", () => {
    const named = entity({
      id: "p1",
      kind: "prop",
      label: "Anything",
      roomId: "entrance",
      presentation: { variant: "crate", glow: false },
    });
    expect(propVariant("observatory", named, 0)).toBe("crate");
    const worded = entity({ id: "p2", kind: "prop", label: "Supply Crate", roomId: "entrance" });
    expect(propVariant("castle", worded, 3)).toBe("crate");
    const plain = entity({ id: "p3", kind: "prop", label: "Zzz", roomId: "entrance" });
    const cycle = propVariants("temple");
    expect(propVariant("temple", plain, 1)).toBe(cycle[1 % cycle.length]);
    expect(propVariant("temple", plain, 1)).toBe(propVariant("temple", plain, 1 + cycle.length));
  });
});
