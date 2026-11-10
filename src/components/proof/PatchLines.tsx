import type { WorldPatch } from "../../contract/patch.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { patchLines } from "./patch-lines.js";

export function PatchLines({ patch, before }: { patch: WorldPatch; before: WorldSpec }) {
  return (
    <figure aria-label="Patch" className="border border-rule bg-paper-raised">
      <p className="flex h-[26px] items-center bg-ink px-3 font-mono text-micro uppercase text-paper-raised">
        Patch · {String(patch.operations.length)}{" "}
        {patch.operations.length === 1 ? "operation" : "operations"}
      </p>
      <ol className="space-y-1 p-3">
        {patchLines(patch, before).map((line, index) => (
          <li key={`${String(index)}-${line}`} className="grid grid-cols-[3.5ch_1fr] gap-x-3">
            <span className="font-mono text-micro text-muted tabular-nums">
              {String(index + 1).padStart(3, "0")}
            </span>
            <span className="text-body text-ink">{line}</span>
          </li>
        ))}
      </ol>
      <p className="border-t border-dashed border-rule-soft px-3 py-2 text-body-s text-ink-72">
        {patch.intent}
      </p>
    </figure>
  );
}
