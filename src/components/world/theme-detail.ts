import { dims, type Block } from "./blocks.js";
import type { SceneLayout } from "./layout-types.js";

export type ThemeDetail = "merlons" | "cornice" | "railing";

type Run = { centre: [number, number]; length: number; onX: boolean };

function tallRuns(blocks: readonly Block[]): Run[] {
  return blocks
    .filter((block) => block.part === "wall" && block.size[1] > dims.wallHeight - 0.01)
    .map((block) => {
      const onX = block.size[0] >= block.size[2];
      return {
        centre: [block.center[0], block.center[2]],
        length: onX ? block.size[0] : block.size[2],
        onX,
      };
    });
}

function piece(
  run: Run,
  part: Block["part"],
  offset: number,
  y: number,
  size: [number, number, number],
): Block {
  const [length, height, depth] = size;
  return {
    part,
    center: run.onX
      ? [run.centre[0] + offset, y, run.centre[1]]
      : [run.centre[0], y, run.centre[1] + offset],
    size: run.onX ? [length, height, depth] : [depth, height, length],
  };
}

function spaced(length: number, pitch: number): number[] {
  const count = Math.max(1, Math.round(length / pitch));
  const step = length / count;
  return Array.from({ length: count }, (_, index) => -length / 2 + step * (index + 0.5));
}

function merlons(runs: readonly Run[]): Block[] {
  const top = dims.wallHeight + 0.17;
  return runs.flatMap((run) =>
    spaced(run.length, 0.96).map((offset) =>
      piece(run, "wall", offset, top, [0.5, 0.34, dims.wallThickness]),
    ),
  );
}

function cornice(runs: readonly Run[], layout: SceneLayout): Block[] {
  const caps = runs.map((run) =>
    piece(run, "frame", 0, dims.wallHeight + 0.07, [
      run.length + 0.16,
      0.14,
      dims.wallThickness + 0.26,
    ]),
  );
  const steps = layout.rooms.map((room): Block => ({
    part: "plinth",
    center: [room.center[0], -dims.plinthHeight + 0.13, room.center[1]],
    size: [room.size + 1.1, 0.26, room.size + 1.1],
  }));
  return [...caps, ...steps];
}

function railing(runs: readonly Run[]): Block[] {
  return runs.flatMap((run) => [
    piece(run, "rail", 0, dims.wallHeight + 0.36, [run.length, 0.06, 0.07]),
    ...spaced(run.length, 1.4).map((offset) =>
      piece(run, "rail", offset, dims.wallHeight + 0.17, [0.07, 0.34, 0.07]),
    ),
  ]);
}

export function themeBlocks(
  layout: SceneLayout,
  blocks: readonly Block[],
  detail: ThemeDetail,
): Block[] {
  const runs = tallRuns(blocks);
  if (detail === "merlons") return merlons(runs);
  return detail === "cornice" ? cornice(runs, layout) : railing(runs);
}
