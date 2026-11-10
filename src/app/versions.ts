import type { GenerationMode, RepairMode } from "../contract/codes.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { worldRevisionHash } from "../domain/canonical.js";
import type { WorldVersion } from "../store/types.js";

export function makeVersion(
  world: WorldSpec,
  source: WorldVersion["source"],
  origin: GenerationMode | RepairMode,
  modelId: string | null,
): WorldVersion {
  return {
    id: crypto.randomUUID(),
    world,
    revisionHash: worldRevisionHash(world),
    source,
    origin,
    modelId,
    parentHash: null,
    patch: null,
    instruction: world.prompt,
    createdAt: new Date().toISOString(),
  };
}
