import type { TestStatus } from "../contract/codes.js";

export type Screen =
  | "empty"
  | "entering_prompt"
  | "generating"
  | "preview_ready"
  | "playing"
  | "editing"
  | "pending_validation"
  | "testing"
  | "verified"
  | "failed"
  | "inconclusive"
  | "repairing"
  | "retesting"
  | "proof_view";

export type ScreenEvent =
  | {
      type:
        | "PROMPT"
        | "GENERATE"
        | "GENERATION_READY"
        | "GENERATION_FAILED"
        | "OPEN_EXAMPLE"
        | "PLAY"
        | "EDIT"
        | "PREVIEW_PATCH"
        | "APPLY_PATCH"
        | "DISCARD_PATCH"
        | "TEST"
        | "REPAIR"
        | "RETEST"
        | "SHOW_PROOF"
        | "RETURN"
        | "NEW_WORLD";
    }
  | { type: "TEST_FINISHED"; status: TestStatus };

const readyScreens: readonly Screen[] = [
  "preview_ready",
  "playing",
  "verified",
  "failed",
  "inconclusive",
  "proof_view",
];

export function screenReducer(screen: Screen, event: ScreenEvent): Screen {
  switch (event.type) {
    case "NEW_WORLD":
      return "entering_prompt";
    case "OPEN_EXAMPLE":
      return "preview_ready";
    case "PROMPT":
      return screen === "empty" ? "entering_prompt" : screen;
    case "GENERATE":
      return screen === "empty" || screen === "entering_prompt" ? "generating" : screen;
    case "GENERATION_READY":
      return screen === "generating" ? "preview_ready" : screen;
    case "GENERATION_FAILED":
      return screen === "generating" ? "entering_prompt" : screen;
    case "PLAY":
      return readyScreens.includes(screen) ? "playing" : screen;
    case "EDIT":
      return readyScreens.includes(screen) ? "editing" : screen;
    case "PREVIEW_PATCH":
      return screen === "editing" ? "pending_validation" : screen;
    case "APPLY_PATCH":
      return screen === "pending_validation" ? "preview_ready" : screen;
    case "DISCARD_PATCH":
      return screen === "pending_validation" ? "editing" : screen;
    case "TEST":
      return readyScreens.includes(screen) ? "testing" : screen;
    case "REPAIR":
      return screen === "failed" || screen === "testing" ? "repairing" : screen;
    case "RETEST":
      return screen === "repairing" ? "retesting" : screen;
    case "SHOW_PROOF":
      return screen === "repairing" || screen === "retesting" ? "proof_view" : screen;
    case "RETURN":
      return screen === "generating" ? screen : "preview_ready";
    case "TEST_FINISHED": {
      if (screen !== "testing" && screen !== "retesting") return screen;
      if (event.status === "VERIFIED") return "verified";
      if (event.status === "FAILED") return "failed";
      if (event.status === "INCONCLUSIVE") return "inconclusive";
      return "preview_ready";
    }
  }
}
