import { describe, expect, it } from "vitest";
import type { FailureCode } from "../../src/contract/codes.js";
import type { Finding } from "../../src/contract/report.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { derive } from "../../src/fixtures/build.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import {
  doorIsAProp,
  doorNeedsMissingKey,
  duplicateEntityIds,
  entityInMissingRoom,
  fourKeys,
  gateOnUnsetFlag,
  goalCompleteAtStart,
  keyHeldByProp,
  selfLoop,
  silentSwitch,
} from "../../src/fixtures/suite-structural.js";
import { validateWorld } from "../../src/verification/validate-world.js";

function codes(findings: Finding[]): FailureCode[] {
  return findings.map((finding) => finding.code);
}

function onlyCode(world: WorldSpec, code: FailureCode): Finding[] {
  const findings = validateWorld(world);
  expect(findings.length).toBeGreaterThan(0);
  expect(codes(findings)).toEqual(findings.map(() => code));
  return findings;
}

describe("validateWorld", () => {
  it("observatory and its twin are structurally sound", () => {
    expect(validateWorld(observatory)).toEqual([]);
    expect(validateWorld(observatoryKeyBehindDoor)).toEqual([]);
  });

  it("F-03 door requires a nonexistent key", () => {
    const findings = onlyCode(doorNeedsMissingKey, "MISSING_REQUIRED_ITEM");
    expect(findings).toHaveLength(1);
    expect(findings[0]?.entityIds).toContain("c2");
    expect(findings[0]?.explanation).toContain("ghost-key");
  });

  it("F-04 entity in a deleted room", () => {
    const [finding] = onlyCode(entityInMissingRoom, "ORPHAN_ENTITY");
    expect(finding?.entityIds).toContain("charts");
    expect(finding?.explanation).toContain("Star Charts");
  });

  it("a flag nobody sets", () => {
    const [finding] = onlyCode(gateOnUnsetFlag, "MISSING_REQUIRED_ITEM");
    expect(finding?.explanation).toContain("power-on");
  });

  it("goal complete at start", () => {
    onlyCode(goalCompleteAtStart, "INVALID_INTERACTION");
  });

  it("duplicate ids", () => {
    const [finding] = onlyCode(duplicateEntityIds, "INVALID_INTERACTION");
    expect(finding?.entityIds).toEqual(["charts"]);
  });

  it("four keys", () => {
    const [finding] = onlyCode(fourKeys, "INVALID_INTERACTION");
    expect(finding?.explanation).toContain("key");
  });

  it("a door reference naming something that is not a door", () => {
    const [finding] = onlyCode(doorIsAProp, "INVALID_INTERACTION");
    expect(finding?.entityIds).toEqual(["c2", "charts"]);
  });

  it("a switch that sets no flag", () => {
    onlyCode(silentSwitch, "INVALID_INTERACTION");
  });

  it("a connection from a room to itself", () => {
    const [finding] = onlyCode(selfLoop, "INVALID_INTERACTION");
    expect(finding?.entityIds).toEqual(["c4"]);
  });

  it("an item granted only by something nobody can use counts as missing", () => {
    const [finding] = onlyCode(keyHeldByProp, "MISSING_REQUIRED_ITEM");
    expect(finding?.entityIds).toContain("c2");
  });

  it("an unknown start room and an unknown connection endpoint are orphans", () => {
    const world = derive(observatory, {
      startRoomId: "lobby",
      connections: [
        ...observatory.connections,
        {
          id: "c4",
          fromRoomId: "portal",
          toRoomId: "roof",
          doorId: null,
          traversableWhen: { op: "true" },
        },
      ],
    });
    const findings = onlyCode(world, "ORPHAN_ENTITY");
    expect(findings.flatMap((finding) => finding.entityIds)).toEqual(
      expect.arrayContaining(["lobby", "c4"]),
    );
  });

  it("keeps every explanation to one readable sentence", () => {
    for (const world of [doorNeedsMissingKey, entityInMissingRoom, fourKeys, selfLoop]) {
      for (const finding of validateWorld(world)) {
        expect(finding.explanation).toMatch(/^[A-Z].*\.$/);
        expect(finding.explanation.length).toBeLessThanOrEqual(400);
      }
    }
  });
});
