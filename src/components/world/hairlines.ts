import { dims } from "./blocks.js";
import type { SceneLayout } from "./layout-types.js";

type Vertex = [number, number, number];

const tile = 1.45;
const gridLift = 0.046;
const siteMargin = 4.5;
const crossArm = 0.9;

function floorGrid(layout: SceneLayout): Vertex[] {
  return layout.rooms.flatMap((room) => {
    const side = room.size - dims.floorInset * 2;
    const cells = Math.max(2, Math.round(side / tile));
    const half = side / 2;
    const lines: Vertex[] = [];
    for (let index = 1; index < cells; index += 1) {
      const offset = -half + (side * index) / cells;
      lines.push(
        [room.center[0] + offset, gridLift, room.center[1] - half],
        [room.center[0] + offset, gridLift, room.center[1] + half],
        [room.center[0] - half, gridLift, room.center[1] + offset],
        [room.center[0] + half, gridLift, room.center[1] + offset],
      );
    }
    return lines;
  });
}

function siteMarks(layout: SceneLayout): Vertex[] {
  const { bounds } = layout;
  const y = -dims.plinthHeight + 0.012;
  const xs = [bounds.minX - siteMargin, bounds.maxX + siteMargin];
  const zs = [bounds.minZ - siteMargin, bounds.maxZ + siteMargin];
  return xs.flatMap((x) =>
    zs.flatMap((z): Vertex[] => [
      [x - crossArm, y, z],
      [x + crossArm, y, z],
      [x, y, z - crossArm],
      [x, y, z + crossArm],
    ]),
  );
}

export function hairlines(layout: SceneLayout): Vertex[] {
  return [...floorGrid(layout), ...siteMarks(layout)];
}
