import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Euler,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Part, PartInstance, PartTone } from "./parts.js";

const creaseAngle = 28;
const one = new Vector3(1, 1, 1);

export type BuiltParts = {
  meshes: Array<{ tone: PartTone; geometry: BufferGeometry }>;
  edges: Array<[number, number, number]>;
};

function shapeOf(part: Part): BufferGeometry {
  const [a, b, c] = part.size;
  const sides = part.sides ?? 24;
  switch (part.shape) {
    case "box":
      return new BoxGeometry(a, b, c);
    case "cylinder":
      return new CylinderGeometry(a, b, c, sides);
    case "cone":
      return new ConeGeometry(a, b, sides);
    case "sphere":
      return new SphereGeometry(a, 24, 16);
    case "dome":
      return new SphereGeometry(a, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    case "torus":
      return new TorusGeometry(a, b, 10, 28);
  }
}

function placement(instance: PartInstance, part: Part): Matrix4 {
  const local = new Matrix4().compose(
    new Vector3(...part.at),
    new Quaternion().setFromEuler(new Euler(...(part.turn ?? [0, 0, 0]))),
    one,
  );
  const world = new Matrix4().compose(
    new Vector3(...instance.position),
    new Quaternion().setFromEuler(new Euler(0, instance.turn, 0)),
    one,
  );
  return world.multiply(local);
}

function edgePoints(geometry: BufferGeometry): Array<[number, number, number]> {
  const edges = new EdgesGeometry(geometry, creaseAngle);
  const positions = edges.getAttribute("position");
  const points: Array<[number, number, number]> = [];
  for (let index = 0; index < positions.count; index += 1) {
    points.push([positions.getX(index), positions.getY(index), positions.getZ(index)]);
  }
  edges.dispose();
  return points;
}

export function buildParts(instances: readonly PartInstance[]): BuiltParts {
  const byTone = new Map<PartTone, BufferGeometry[]>();
  const edges: Array<[number, number, number]> = [];
  for (const instance of instances) {
    for (const part of instance.parts) {
      const geometry = shapeOf(part).applyMatrix4(placement(instance, part));
      edges.push(...edgePoints(geometry));
      const tone = part.tone ?? "white";
      byTone.set(tone, [...(byTone.get(tone) ?? []), geometry]);
    }
  }
  const meshes = [...byTone].flatMap(([tone, geometries]) => {
    const geometry = mergeGeometries(geometries);
    for (const item of geometries) item.dispose();
    return [{ tone, geometry }];
  });
  return { meshes, edges };
}
