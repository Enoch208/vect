import type { Point, SceneBounds } from "./layout-types.js";

export const cameraPitch = (35 * Math.PI) / 180;
export const cameraYaw = (45 * Math.PI) / 180;
export const fitMargin = 0.9;
const pitch = cameraPitch;
const yaw = cameraYaw;

export const cameraDistance = 160;
export const modelHeight = 2.6;
export const captionDrop = 3.2;

export const viewDirection: [number, number, number] = [
  Math.sin(yaw) * Math.cos(pitch),
  Math.sin(pitch),
  Math.cos(yaw) * Math.cos(pitch),
];

export function projectToView(x: number, y: number, z: number): Point {
  const u = x * Math.cos(yaw) - z * Math.sin(yaw);
  const v = y * Math.cos(pitch) - (x * Math.sin(yaw) + z * Math.cos(yaw)) * Math.sin(pitch);
  return [u, v];
}

export function groundPoint(u: number, v: number): Point {
  const depth = v / Math.sin(pitch);
  return [u * Math.cos(yaw) - depth * Math.sin(yaw), -u * Math.sin(yaw) - depth * Math.cos(yaw)];
}

export type ViewFit = { center: Point; zoom: number; span: Point };

export function fitView(
  bounds: SceneBounds,
  viewport: { width: number; height: number },
  margin: number,
): ViewFit {
  const corners = [bounds.minX, bounds.maxX].flatMap((x) =>
    [bounds.minZ, bounds.maxZ].flatMap((z) => [
      projectToView(x, 0, z),
      projectToView(x, modelHeight, z),
    ]),
  );
  const us = corners.map((corner) => corner[0]);
  const vs = corners.map((corner) => corner[1]);
  const minU = Math.min(...us);
  const maxU = Math.max(...us);
  const minV = Math.min(...vs) - captionDrop;
  const maxV = Math.max(...vs);
  const span: Point = [Math.max(1, maxU - minU), Math.max(1, maxV - minV)];
  const zoom = Math.min(viewport.width / span[0], viewport.height / span[1]) * margin;
  return { center: groundPoint((minU + maxU) / 2, (minV + maxV) / 2), zoom, span };
}

export function clampToBounds(point: Point, bounds: SceneBounds): Point {
  return [
    Math.min(bounds.maxX, Math.max(bounds.minX, point[0])),
    Math.min(bounds.maxZ, Math.max(bounds.minZ, point[1])),
  ];
}
