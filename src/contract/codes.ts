export const themes = ["castle", "observatory", "temple"] as const;
export type Theme = (typeof themes)[number];

export const entityKinds = [
  "key",
  "door",
  "switch",
  "barrier",
  "chest",
  "trap",
  "portal",
  "checkpoint",
  "goal",
  "prop",
] as const;
export type EntityKind = (typeof entityKinds)[number];

export const interactiveKinds = [
  "key",
  "switch",
  "barrier",
  "chest",
  "trap",
  "checkpoint",
] as const satisfies readonly EntityKind[];

export const gateKinds = ["door", "portal"] as const satisfies readonly EntityKind[];

export const prefabs = ["small", "medium", "large"] as const;
export type Prefab = (typeof prefabs)[number];

export const generationModes = ["live_ai", "deterministic_parser", "sample_fixture"] as const;
export type GenerationMode = (typeof generationModes)[number];

export const repairModes = ["live_ai", "deterministic_rule"] as const;
export type RepairMode = (typeof repairModes)[number];

export const agentModes = ["bounded_solver", "heuristic_agent", "llm_tool_agent"] as const;
export type AgentMode = (typeof agentModes)[number];

export const testStatuses = [
  "QUEUED",
  "RUNNING",
  "VERIFIED",
  "FAILED",
  "INCONCLUSIVE",
  "CANCELLED",
  "ERROR",
  "STALE",
] as const;
export type TestStatus = (typeof testStatuses)[number];

export const solvabilityStatuses = ["SOLVABLE", "PROVEN_UNREACHABLE", "INCONCLUSIVE"] as const;
export type SolvabilityStatus = (typeof solvabilityStatuses)[number];

export const failureCodes = [
  "MISSING_REQUIRED_ITEM",
  "CIRCULAR_DEPENDENCY",
  "UNREACHABLE_GOAL",
  "BLOCKED_EDGE",
  "ORPHAN_ENTITY",
  "INVALID_INTERACTION",
  "TEST_BUDGET_EXHAUSTED",
  "UNKNOWN_FAILURE",
] as const;
export type FailureCode = (typeof failureCodes)[number];

export const eventCodes = [
  "MOVED",
  "DOOR_UNLOCKED",
  "DOOR_LOCKED",
  "ROUTE_BLOCKED",
  "NOT_ADJACENT",
  "UNKNOWN_ROOM",
  "ITEM_COLLECTED",
  "FLAG_SET",
  "NEUTRALIZED",
  "ACTIVATED",
  "UNKNOWN_ENTITY",
  "ENTITY_NOT_HERE",
  "ALREADY_USED",
  "REQUIREMENT_UNMET",
  "NOT_INTERACTIVE",
  "INSPECTED",
  "WAITED",
  "GOAL_COMPLETE",
  "ALREADY_WON",
] as const;
export type EventCode = (typeof eventCodes)[number];

export const repairOutcomes = [
  "ACCEPTED_FOR_VERIFICATION",
  "REJECTED_INVALID",
  "REJECTED_INTENT_BREAKING",
  "REJECTED_UNSOLVABLE",
] as const;
export type RepairOutcome = (typeof repairOutcomes)[number];

export const apiErrorCodes = [
  "INVALID_REQUEST",
  "GENERATION_UNSUPPORTED",
  "GENERATION_INVALID",
  "STALE_REVISION",
  "RATE_LIMITED",
  "PROVIDER_INVALID",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_TIMEOUT",
  "MODEL_NOT_CONFIGURED",
  "INTERNAL",
] as const;
export type ApiErrorCode = (typeof apiErrorCodes)[number];

export const difficulties = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof difficulties)[number];
