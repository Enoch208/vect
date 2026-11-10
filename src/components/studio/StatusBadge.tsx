import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArtificialIntelligence04Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  FileEditIcon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import type { BadgeStatus } from "./status.js";

const neutral = "border-rule text-muted";
const warning = "border-caution text-caution";
const error = "border-accent bg-accent-soft text-ink";
const badges = {
  VERIFIED: {
    label: "Verified",
    icon: CheckmarkCircle02Icon,
    style: "border-positive text-positive",
  },
  FAILED: { label: "Failed", icon: CancelCircleIcon, style: error },
  INCONCLUSIVE: { label: "Inconclusive", icon: AlertCircleIcon, style: warning },
  STALE: { label: "Stale", icon: Clock01Icon, style: warning },
  ERROR: { label: "Error", icon: AlertCircleIcon, style: error },
  CANCELLED: { label: "Cancelled", icon: CancelCircleIcon, style: neutral },
  QUEUED: { label: "Queued", icon: Clock01Icon, style: neutral },
  RUNNING: { label: "Running", icon: Clock01Icon, style: neutral },
  DRAFT: { label: "Draft", icon: FileEditIcon, style: warning },
  UNVERIFIED: { label: "Unverified", icon: AlertCircleIcon, style: neutral },
  EXAMPLE: { label: "Example world", icon: SourceCodeIcon, style: neutral },
  AI_GENERATED: { label: "AI generated", icon: ArtificialIntelligence04Icon, style: neutral },
  LOCAL_PARSER: { label: "Local parser: limited commands", icon: SourceCodeIcon, style: neutral },
  RULE_REPAIR: { label: "Rule-based repair", icon: SourceCodeIcon, style: neutral },
  AI_REPAIR: { label: "AI repair proposal", icon: ArtificialIntelligence04Icon, style: neutral },
} satisfies Record<BadgeStatus, { label: string; icon: typeof Clock01Icon; style: string }>;

export function StatusBadge({ status, detail }: { status: BadgeStatus; detail?: string }) {
  const badge = badges[status];
  return (
    <span
      data-status={status}
      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-micro font-medium uppercase ${badge.style}`}
    >
      <HugeiconsIcon icon={badge.icon} size={14} strokeWidth={1.5} aria-hidden />
      <span>
        {badge.label}
        {detail ? ` · ${detail}` : ""}
      </span>
    </span>
  );
}
