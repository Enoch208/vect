import type { WorldPatch } from "../../contract/patch.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { describePatch } from "./describe-patch.js";

export function PatchDiff({ patch, before }: { patch: WorldPatch; before: WorldSpec }) {
  return (
    <ol className="divide-y divide-rule-soft border border-rule">
      {describePatch(patch, before).map((line, index) => (
        <li key={`${String(index)}-${line}`} className="flex gap-3 p-3 text-body">
          <span className="font-mono text-micro text-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{line}</span>
        </li>
      ))}
    </ol>
  );
}
