import { describe, expect, it } from "vitest";
import { projectToView } from "../../src/components/world/camera-math.js";
import {
  labelSize,
  maxLabelChars,
  placeLabels,
  wrapLabel,
  type LabelSpec,
  type PlacedLabel,
} from "../../src/components/world/label-layout.js";

function rect(label: PlacedLabel, zoom: number) {
  const [u, v] = projectToView(...label.anchor);
  const bottom = v * zoom + label.lift;
  return {
    left: u * zoom - label.width / 2,
    right: u * zoom + label.width / 2,
    bottom,
    top: bottom + label.height,
  };
}

describe("wrapLabel", () => {
  it("wraps a 60-character label into lines no longer than the limit", () => {
    const label = "The Extraordinarily Long Name Of A Door That Leads To Nowhere";
    expect(label.length).toBeGreaterThanOrEqual(60);
    const lines = wrapLabel(label);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => line.length <= maxLabelChars)).toBe(true);
    expect(lines.join(" ")).toBe(label);
  });

  it("breaks a single word that is longer than a line", () => {
    const lines = wrapLabel("A".repeat(60));
    expect(lines.every((line) => line.length <= maxLabelChars)).toBe(true);
    expect(lines.join("")).toBe("A".repeat(60));
  });

  it("keeps a short label on one line", () => {
    expect(wrapLabel("Access Key")).toEqual(["Access Key"]);
  });
});

describe("placeLabels", () => {
  const zoom = 22;
  const spec = (id: string, index: number, priority: number): LabelSpec => ({
    id,
    anchor: [index * 0.4, 1, index * 0.2],
    lines: ["PORTAL SWITCH"],
    badge: null,
    below: false,
    priority,
  });
  const crowded = ["a", "b", "c", "d"].map((id, index) => spec(id, index, 1));

  it("lifts labels until none overlap", () => {
    const placed = placeLabels(crowded, zoom).map((label) => rect(label, zoom));
    placed.forEach((a, index) => {
      for (const b of placed.slice(index + 1)) {
        const apart =
          a.right <= b.left || b.right <= a.left || a.top <= b.bottom || b.top <= a.bottom;
        expect(apart).toBe(true);
      }
    });
  });

  it("leaves a lone label where it is and reports its size", () => {
    const [only] = placeLabels(crowded.slice(0, 1), zoom);
    expect(only?.lift).toBe(0);
    expect(only?.width).toBeCloseTo(labelSize(["PORTAL SWITCH"]).width);
  });

  it("is deterministic and keeps the higher priority label in place", () => {
    const specs = [spec("low", 0, 1), spec("high", 0, 5)];
    const placed = placeLabels(specs, zoom);
    expect(placed.find((label) => label.id === "high")?.lift).toBe(0);
    expect(placed.find((label) => label.id === "low")?.lift).toBeGreaterThan(0);
    expect(placeLabels(specs, zoom)).toEqual(placed);
  });
});
