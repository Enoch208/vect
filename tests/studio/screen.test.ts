import { describe, expect, it } from "vitest";
import { screenReducer } from "../../src/app/screen.js";
import { makeVersion } from "../../src/app/versions.js";
import { badgeFor, versionStatus } from "../../src/components/studio/status.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { verifyWorld } from "../../src/verification/verify.js";

describe("the screen machine", () => {
  it("restores a loaded world into a playable screen without interrupting a new prompt", () => {
    const restored = screenReducer("empty", { type: "RESTORE" });
    expect(restored).toBe("preview_ready");
    expect(screenReducer(restored, { type: "PLAY" })).toBe("playing");
    expect(screenReducer(restored, { type: "TEST" })).toBe("testing");
    expect(screenReducer("entering_prompt", { type: "RESTORE" })).toBe("entering_prompt");
    expect(screenReducer("generating", { type: "RETURN" })).toBe("preview_ready");
  });
  it("generating cannot jump to verified", () => {
    expect(screenReducer("generating", { type: "TEST_FINISHED", status: "VERIFIED" })).toBe(
      "generating",
    );
  });

  it("an edit from verified goes to editing", () => {
    expect(screenReducer("verified", { type: "EDIT" })).toBe("editing");
    expect(screenReducer("testing", { type: "EDIT" })).toBe("editing");
  });

  it("only a completed test can enter verified", () => {
    expect(screenReducer("testing", { type: "TEST_FINISHED", status: "VERIFIED" })).toBe(
      "verified",
    );
    expect(screenReducer("retesting", { type: "TEST_FINISHED", status: "INCONCLUSIVE" })).toBe(
      "inconclusive",
    );
    expect(screenReducer("testing", { type: "TEST_FINISHED", status: "ERROR" })).toBe(
      "preview_ready",
    );
  });

  it("opening an example never enters verified", () => {
    expect(screenReducer("empty", { type: "OPEN_EXAMPLE" })).toBe("preview_ready");
  });
});

describe("origin and proof status", () => {
  const example = makeVersion(observatory, "example", "sample_fixture", null);

  it("the example world is labelled EXAMPLE, never AI_GENERATED", () => {
    expect(badgeFor(example)).toBe("EXAMPLE");
    expect(badgeFor({ ...example, source: "edited", origin: "live_ai" })).toBe("EXAMPLE");
  });

  it("a sample or a playable world is unverified until there is a report", () => {
    expect(versionStatus(example, {})).toBe("UNVERIFIED");
  });

  it("an edit makes old proof stale and undo restores its engine status", () => {
    const report = verifyWorld(observatory, {
      seed: observatory.seed,
      now: () => 0,
      isoNow: () => observatory.metadata.createdAt,
    });
    const edited = {
      ...makeVersion(observatoryKeyBehindDoor, "edited", "live_ai", null),
      parentHash: example.revisionHash,
    };
    const reports = { [report.worldRevisionHash]: report };
    expect(versionStatus(example, reports)).toBe("VERIFIED");
    expect(versionStatus(edited, reports)).toBe("STALE");
    const later = {
      ...makeVersion({ ...observatoryKeyBehindDoor, revision: 3 }, "edited", "live_ai", null),
      parentHash: edited.revisionHash,
    };
    expect(versionStatus(later, reports, [example, edited, later])).toBe("STALE");
    expect(versionStatus(example, reports)).toBe("VERIFIED");
    expect(versionStatus(example, { [example.revisionHash]: { ...report, initialSeed: 1 } })).toBe(
      "ERROR",
    );
  });
});
