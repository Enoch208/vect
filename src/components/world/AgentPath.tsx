import { Line } from "@react-three/drei";
import { useEffect, useMemo, type ReactElement } from "react";
import { CircleGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { pathAnchors, pathLegs } from "./anchors.js";
import { Flat } from "./paint.js";
import { useScene } from "./scene-context.js";

const lift = 0.085;
const dotRadius = 0.17;

type AgentPathProps = { world: WorldSpec; path: ReadonlyArray<{ x: number; z: number }> };

export function AgentPath({ world, path }: AgentPathProps): ReactElement | null {
  const { layout, kit } = useScene();
  const points = useMemo(
    () =>
      pathLegs(world, layout, path).flatMap((leg): Array<[number, number, number]> => [
        [leg.from[0], lift, leg.from[1]],
        [leg.to[0], lift, leg.to[1]],
      ]),
    [world, layout, path],
  );
  const dots = useMemo(() => {
    const stops = pathAnchors(world, layout, path);
    if (stops.length === 0) return null;
    const discs = stops.map(([x, z]) =>
      new CircleGeometry(dotRadius, 20).rotateX(-Math.PI / 2).translate(x, lift + 0.004, z),
    );
    const merged = mergeGeometries(discs);
    for (const disc of discs) disc.dispose();
    return merged;
  }, [world, layout, path]);
  useEffect(() => () => dots?.dispose(), [dots]);
  if (points.length === 0 || dots === null) return null;
  return (
    <group>
      <Line points={points} segments color={kit.ink} lineWidth={2} />
      <mesh geometry={dots}>
        <Flat color={kit.ink} />
      </mesh>
    </group>
  );
}
