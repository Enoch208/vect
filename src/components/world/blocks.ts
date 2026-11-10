import type { CorridorLayout, RoomLayout, SceneLayout, Side } from "./layout-types.js";

export const dims = {
  plinthHeight: 0.8,
  wallHeight: 1.7,
  curbHeight: 0.26,
  wallThickness: 0.34,
  doorWidth: 1.9,
  frameHeight: 2.05,
  bridgeWidth: 2.3,
  bridgeHeight: 0.3,
  railHeight: 0.14,
  floorInset: 0.62,
} as const;

export type BlockPart = "plinth" | "wall" | "frame" | "bridge" | "rail";

export type Block = {
  part: BlockPart;
  center: [number, number, number];
  size: [number, number, number];
};

const tallSides: readonly Side[] = ["n", "w"];

function isTall(side: Side): boolean {
  return tallSides.includes(side);
}

function runs(half: number, gaps: readonly number[]): Array<[number, number]> {
  const edges = [...gaps]
    .sort((a, b) => a - b)
    .flatMap((gap) => [gap - dims.doorWidth / 2, gap + dims.doorWidth / 2]);
  const stops = [-half, ...edges, half];
  const spans: Array<[number, number]> = [];
  for (let index = 0; index < stops.length; index += 2) {
    const start = stops[index] ?? 0;
    const end = stops[index + 1] ?? 0;
    if (end - start > 0.05) spans.push([start, end]);
  }
  return spans;
}

function along(
  room: RoomLayout,
  side: Side,
  from: number,
  to: number,
  height: number,
  part: BlockPart,
  thickness: number,
): Block {
  const horizontal = side === "n" || side === "s";
  const edge = (room.size / 2 - dims.wallThickness / 2) * (side === "n" || side === "w" ? -1 : 1);
  const mid = (from + to) / 2;
  const length = to - from;
  return {
    part,
    center: horizontal
      ? [room.center[0] + mid, height / 2, room.center[1] + edge]
      : [room.center[0] + edge, height / 2, room.center[1] + mid],
    size: horizontal ? [length, height, thickness] : [thickness, height, length],
  };
}

function roomBlocks(room: RoomLayout, framed: ReadonlySet<string>): Block[] {
  const half = room.size / 2;
  const plinth: Block = {
    part: "plinth",
    center: [room.center[0], -dims.plinthHeight / 2, room.center[1]],
    size: [room.size, dims.plinthHeight, room.size],
  };
  const sides: Side[] = ["n", "s", "e", "w"];
  const walls = sides.flatMap((side) => {
    const horizontal = side === "n" || side === "s";
    const reach = horizontal ? half : half - dims.wallThickness;
    const openings = room.openings.filter((opening) => opening.side === side);
    const height = isTall(side) ? dims.wallHeight : dims.curbHeight;
    const spans = runs(
      reach,
      openings.map((opening) => opening.offset),
    );
    const segments = spans.map(([from, to]) =>
      along(room, side, from, to, height, "wall", dims.wallThickness),
    );
    const frames = openings
      .filter((opening) => framed.has(`${room.id}:${opening.connectionId}`))
      .flatMap((opening) => {
        const post = dims.wallThickness + 0.12;
        const left = opening.offset - dims.doorWidth / 2;
        const right = opening.offset + dims.doorWidth / 2;
        const lintel = along(room, side, left - post, right + post, 0.22, "frame", post);
        lintel.center[1] = dims.frameHeight + 0.11;
        return [
          along(room, side, left - post, left, dims.frameHeight, "frame", post),
          along(room, side, right, right + post, dims.frameHeight, "frame", post),
          lintel,
        ];
      });
    return [...segments, ...frames];
  });
  return [plinth, ...walls];
}

function corridorBlocks(corridor: CorridorLayout): Block[] {
  if (corridor.kind !== "corridor") return [];
  const onX = corridor.axis === "x";
  const length = onX
    ? Math.abs(corridor.to[0] - corridor.from[0])
    : Math.abs(corridor.to[1] - corridor.from[1]);
  const mid: [number, number] = [
    (corridor.from[0] + corridor.to[0]) / 2,
    (corridor.from[1] + corridor.to[1]) / 2,
  ];
  const deck: Block = {
    part: "bridge",
    center: [mid[0], -dims.bridgeHeight / 2 - 0.02, mid[1]],
    size: onX
      ? [length, dims.bridgeHeight, dims.bridgeWidth]
      : [dims.bridgeWidth, dims.bridgeHeight, length],
  };
  const rails = [-1, 1].map((sign): Block => {
    const shift = sign * (dims.bridgeWidth / 2 - 0.06);
    return {
      part: "rail",
      center: onX
        ? [mid[0], dims.railHeight / 2 - 0.02, mid[1] + shift]
        : [mid[0] + shift, dims.railHeight / 2 - 0.02, mid[1]],
      size: onX ? [length, dims.railHeight, 0.12] : [0.12, dims.railHeight, length],
    };
  });
  return [deck, ...rails];
}

export function architectureBlocks(layout: SceneLayout): Block[] {
  const framed = new Set(
    layout.corridors
      .filter((corridor) => corridor.kind === "corridor" && corridor.gateEntityId !== null)
      .map((corridor) => {
        const atStart =
          corridor.gate[0] === corridor.from[0] && corridor.gate[1] === corridor.from[1];
        return `${atStart ? corridor.fromRoomId : corridor.toRoomId}:${corridor.connectionId}`;
      }),
  );
  return [
    ...layout.rooms.flatMap((room) => roomBlocks(room, framed)),
    ...layout.corridors.flatMap(corridorBlocks),
  ];
}

export function blockEdges(block: Block): Array<[number, number, number]> {
  const [cx, cy, cz] = block.center;
  const [hx, hy, hz] = [block.size[0] / 2, block.size[1] / 2, block.size[2] / 2];
  const corner = (sx: number, sy: number, sz: number): [number, number, number] => [
    cx + sx * hx,
    cy + sy * hy,
    cz + sz * hz,
  ];
  const signs = [-1, 1];
  const edges: Array<[number, number, number]> = [];
  for (const a of signs) {
    for (const b of signs) {
      edges.push(corner(-1, a, b), corner(1, a, b));
      edges.push(corner(a, -1, b), corner(a, 1, b));
      edges.push(corner(a, b, -1), corner(a, b, 1));
    }
  }
  return edges;
}
