import { describe, expect, it } from "vitest";
import { architectureBlocks, blockEdges, dims } from "../../src/components/world/blocks.js";
import {
  captionDrop,
  fitLayout,
  fitMargin,
  fitView,
  modelHeight,
  projectToView,
} from "../../src/components/world/camera-math.js";
import { layoutWorld, type Point, type SceneLayout } from "../../src/components/world/layout.js";
import { observatory } from "../../src/fixtures/observatory.js";
import { tenRoomTemple } from "../../src/fixtures/suite-large.js";

function occupiedView(layout: SceneLayout): Point[] {
  const geometry = architectureBlocks(layout).flatMap((block) =>
    blockEdges(block).map((point) => projectToView(...point)),
  );
  for (const room of layout.rooms) {
    for (const x of [-1, 1]) {
      for (const z of [-1, 1]) {
        geometry.push(
          projectToView(
            room.center[0] + (x * room.size) / 2,
            modelHeight,
            room.center[1] + (z * room.size) / 2,
          ),
        );
      }
    }
    const label = projectToView(
      room.center[0] + room.size / 2,
      -dims.plinthHeight,
      room.center[1] + room.size / 2,
    );
    geometry.push([label[0], label[1] - captionDrop]);
  }
  return geometry;
}

describe("layout camera fit", () => {
  it("centres the asymmetric temple on occupied space rather than empty bounding corners", () => {
    const layout = layoutWorld(tenRoomTemple);
    const viewport = { width: 1366, height: 768 };
    const fit = fitLayout(layout, viewport, fitMargin);
    const previous = fitView(layout.bounds, viewport, fitMargin);
    expect(
      Math.hypot(fit.center[0] - previous.center[0], fit.center[1] - previous.center[1]),
    ).toBeGreaterThan(3);
    expect(fit.zoom).toBeGreaterThan(previous.zoom);
  });

  it("fits and centres all architecture, model tops and room captions at desktop and portrait sizes", () => {
    for (const world of [observatory, tenRoomTemple]) {
      const layout = layoutWorld(world);
      for (const viewport of [
        { width: 1366, height: 768 },
        { width: 390, height: 768 },
      ]) {
        const fit = fitLayout(layout, viewport, fitMargin);
        const center = projectToView(fit.center[0], 0, fit.center[1]);
        const projected = occupiedView(layout).map(([u, v]): Point => [
          (u - center[0]) * fit.zoom,
          (v - center[1]) * fit.zoom,
        ]);
        const us = projected.map(([u]) => u);
        const vs = projected.map(([, v]) => v);
        expect(Math.min(...us)).toBeCloseTo(-Math.max(...us));
        expect(Math.min(...vs)).toBeCloseTo(-Math.max(...vs));
        for (const [u, v] of projected) {
          expect(Math.abs(u)).toBeLessThanOrEqual((viewport.width * fitMargin) / 2 + 1e-8);
          expect(Math.abs(v)).toBeLessThanOrEqual((viewport.height * fitMargin) / 2 + 1e-8);
        }
      }
    }
  });

  it("includes a corridor span outside the room footprint and ignores inflated world bounds", () => {
    const original = layoutWorld(observatory);
    const first = original.corridors[0];
    if (first === undefined) throw new Error("corridor is missing");
    const layout: SceneLayout = {
      ...original,
      corridors: [{ ...first, from: [4.5, -18], to: [10.5, -18] }, ...original.corridors.slice(1)],
    };
    const viewport = { width: 1366, height: 768 };
    const fit = fitLayout(layout, viewport, fitMargin);
    const center = projectToView(fit.center[0], 0, fit.center[1]);
    for (const [u, v] of occupiedView(layout)) {
      expect(Math.abs(u - center[0]) * fit.zoom).toBeLessThanOrEqual(
        (viewport.width * fitMargin) / 2 + 1e-8,
      );
      expect(Math.abs(v - center[1]) * fit.zoom).toBeLessThanOrEqual(
        (viewport.height * fitMargin) / 2 + 1e-8,
      );
    }
    expect(
      fitLayout(
        { ...layout, bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 } },
        viewport,
        fitMargin,
      ),
    ).toEqual(fit);
  });
});
