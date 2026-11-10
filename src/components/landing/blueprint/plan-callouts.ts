import type { FailureCode } from "../../../contract/codes.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import type { WorldCheck } from "../../../verification/check-world.js";

export type PlanCallout = { targetId: string; code: string };

export function calloutTarget(world: WorldSpec, ids: readonly string[]): string | null {
  const gate = ids.find((id) =>
    world.entities.some(
      (item) => item.id === id && (item.kind === "door" || item.kind === "portal"),
    ),
  );
  return gate ?? ids.find((id) => world.entities.some((item) => item.id === id)) ?? ids[0] ?? null;
}

export function findingCallouts(world: WorldSpec, check: WorldCheck): PlanCallout[] {
  const findings = [...check.structural, ...(check.solvability?.findings ?? [])];
  return findings.flatMap((finding: { code: FailureCode; entityIds: string[] }) => {
    const targetId = calloutTarget(world, finding.entityIds);
    return targetId === null ? [] : [{ targetId, code: finding.code }];
  });
}
