import {
  CircleGeometry,
  Color,
  Float32BufferAttribute,
  RingGeometry,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const cache = new Map<string, BufferGeometry>();

function painted(geometry: BufferGeometry, hex: string): BufferGeometry {
  const color = new Color(hex);
  const count = geometry.getAttribute("position").count;
  const values = Array.from({ length: count }, () => [color.r, color.g, color.b]).flat();
  geometry.setAttribute("color", new Float32BufferAttribute(values, 3));
  return geometry;
}

export function badgeGeometry(fill: string, ring: string): BufferGeometry {
  const key = `${fill}|${ring}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const disc = painted(new CircleGeometry(10, 32), fill);
  const band = painted(new RingGeometry(8.6, 10, 40).translate(0, 0, 0.01), ring);
  const merged = mergeGeometries([disc, band]);
  disc.dispose();
  band.dispose();
  cache.set(key, merged);
  return merged;
}
