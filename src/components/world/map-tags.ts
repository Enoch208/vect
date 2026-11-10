import type { WorldSpec } from "../../contract/world.schema.js";
import type { SceneLayout } from "./layout-types.js";
import { pairTags } from "./pairing.js";

export type MapTags = {
  entity: Map<string, string>;
  connection: Map<string, string[]>;
  portal: Map<string, string>;
};

export function assignTags(world: WorldSpec, layout: SceneLayout): MapTags {
  const pairing = pairTags(world);
  const portal = new Map(
    layout.corridors
      .filter((corridor) => corridor.kind === "portal")
      .map((corridor, index) => [corridor.connectionId, `P${String(index + 1)}`]),
  );
  return { entity: pairing.entityTags, connection: pairing.connectionTags, portal };
}
