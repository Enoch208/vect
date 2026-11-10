import type { VerificationReport } from "../../contract/report.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { worldRevisionHash } from "../../domain/canonical.js";

export function reportBundle(
  world: WorldSpec,
  report: VerificationReport,
): { fileName: string; json: string } {
  return {
    fileName: `vect-report-${world.id}-${worldRevisionHash(world).slice(0, 12)}.json`,
    json: JSON.stringify({ world, report }, null, 2),
  };
}
