import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArtificialIntelligence04Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import type { TestStatus } from "../../contract/codes.js";

export type ChipStatus = TestStatus | "UNVERIFIED" | "RULE_REPAIR" | "AI_REPAIR";

const neutral = "border-rule text-muted";
const warning = "border-caution text-caution";
const failure = "border-accent bg-accent-soft text-ink";

const chips = {
  VERIFIED: {
    label: "Verified",
    icon: CheckmarkCircle02Icon,
    style: "border-positive text-positive",
  },
  FAILED: { label: "Failed", icon: CancelCircleIcon, style: failure },
  INCONCLUSIVE: { label: "Inconclusive", icon: AlertCircleIcon, style: warning },
  STALE: { label: "Stale", icon: Clock01Icon, style: warning },
  ERROR: { label: "Error", icon: AlertCircleIcon, style: failure },
  CANCELLED: { label: "Cancelled", icon: CancelCircleIcon, style: neutral },
  QUEUED: { label: "Queued", icon: Clock01Icon, style: neutral },
  RUNNING: { label: "Running", icon: Clock01Icon, style: neutral },
  UNVERIFIED: { label: "Unverified", icon: AlertCircleIcon, style: neutral },
  RULE_REPAIR: { label: "Rule-based repair", icon: SourceCodeIcon, style: neutral },
  AI_REPAIR: { label: "AI repair proposal", icon: ArtificialIntelligence04Icon, style: neutral },
} satisfies Record<ChipStatus, { label: string; icon: typeof Clock01Icon; style: string }>;

export function StatusChip({ status }: { status: ChipStatus }) {
  const chip = chips[status];
  return (
    <span
      data-status={status}
      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-micro font-medium uppercase ${chip.style}`}
    >
      <HugeiconsIcon icon={chip.icon} size={14} strokeWidth={1.5} aria-hidden />
      <span>{chip.label}</span>
    </span>
  );
}
