export const cellSize = 14;
export const roomSize = { small: 7, medium: 9, large: 11 } as const;
export const entityReach = 0.4;
export const entitySpread = 0.8;

export type Side = "n" | "s" | "e" | "w";
export type Point = [number, number];

export type Opening = {
  side: Side;
  connectionId: string;
  offset: number;
  point: Point;
};

export type RoomLayout = {
  id: string;
  label: string;
  center: Point;
  size: number;
  openings: Opening[];
};

export type CorridorLayout = {
  connectionId: string;
  kind: "corridor" | "portal";
  from: Point;
  to: Point;
  fromRoomId: string;
  toRoomId: string;
  axis: "x" | "z";
  gate: Point;
  gateEntityId: string | null;
  gated: boolean;
  conditional: boolean;
};

export type EntityLayout = {
  id: string;
  roomId: string;
  position: [number, number, number];
  footprint: number;
};

export type SceneBounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export type SceneLayout = {
  rooms: RoomLayout[];
  corridors: CorridorLayout[];
  entities: EntityLayout[];
  bounds: SceneBounds;
};

export type Disc = { x: number; z: number; r: number };

export const sideVector: Record<Side, Point> = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
};

export function gridToScene(p: { x: number; z: number }): Point {
  return [p.x * cellSize, p.z * cellSize];
}
