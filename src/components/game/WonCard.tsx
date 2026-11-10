export function WonCard({ onReset, onTest }: { onReset: () => void; onTest: () => void }) {
  return (
    <div
      role="status"
      className="absolute inset-x-8 bottom-8 mx-auto max-w-md space-y-4 border border-rule bg-paper-raised p-5"
    >
      <h2 className="flex items-center gap-3 font-display text-[26.7px] leading-none font-semibold uppercase">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} aria-hidden />
        Objective complete
      </h2>
      <p className="text-body">
        You reached the goal. Test this world to check its rules and replay the evidence.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="studio-button" onClick={onReset}>
          Play again
        </button>
        <button type="button" className="studio-button studio-button-primary" onClick={onTest}>
          Test this world
        </button>
      </div>
    </div>
  );
}
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
