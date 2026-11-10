import { beforeEach, describe, expect, it } from "vitest";
import type { GameAction } from "../../src/contract/game.schema.js";
import type { VerificationReport } from "../../src/contract/report.schema.js";
import { engineVersion, reportVersion, verifierVersion } from "../../src/contract/versions.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { createInitialState } from "../../src/domain/step-game.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { usePlayStore } from "../../src/store/play-store.js";
import { useProjectStore } from "../../src/store/project-store.js";
import type { WorldVersion } from "../../src/store/types.js";

const winningRun: GameAction[] = [
  { type: "MOVE_TO", roomId: "library" },
  { type: "INTERACT", entityId: "key1" },
  { type: "MOVE_TO", roomId: "control" },
  { type: "INTERACT", entityId: "switch1" },
  { type: "MOVE_TO", roomId: "portal" },
];

function version(world: WorldSpec): WorldVersion {
  return {
    id: `version-${String(world.revision)}`,
    world,
    revisionHash: worldRevisionHash(world),
    source: "example",
    origin: "sample_fixture",
    modelId: null,
    parentHash: null,
    patch: null,
    instruction: world.prompt,
    createdAt: world.metadata.createdAt,
  };
}

function failedReport(world: WorldSpec): VerificationReport {
  return {
    reportVersion,
    reportId: "store-test-report",
    createdAt: "2026-11-10T00:00:00.000Z",
    worldId: world.id,
    worldRevisionHash: worldRevisionHash(world),
    initialSeed: world.seed,
    engineVersion,
    verifierVersion,
    agentMode: "heuristic_agent",
    status: "FAILED",
    assertions: [],
    findings: [],
    trace: [],
    exploredStates: null,
    elapsedMs: 0,
    failureReason: "Report storage test fixture",
    replayPass: false,
    reportDigest: "store-test-digest",
  };
}

beforeEach(() => {
  useProjectStore.setState(useProjectStore.getInitialState(), true);
  usePlayStore.setState(usePlayStore.getInitialState(), true);
});

describe("the play session", () => {
  it("does not act before a world is started", () => {
    expect(usePlayStore.getState().act({ type: "MOVE_TO", roomId: "library" })).toBeNull();
    expect(usePlayStore.getState().log).toEqual([]);
  });

  it("a refused move leaves state identical and records lastRefused DOOR_LOCKED", () => {
    const play = usePlayStore.getState();
    play.start(observatory);
    play.act({ type: "MOVE_TO", roomId: "library" });
    const before = usePlayStore.getState().state;
    const transition = play.act({ type: "MOVE_TO", roomId: "control" });

    expect(transition?.ok).toBe(false);
    expect(usePlayStore.getState().state).toBe(before);
    expect(usePlayStore.getState().lastRefused).toEqual(transition?.event);
    expect(usePlayStore.getState().lastRefused?.code).toBe("DOOR_LOCKED");
    expect(usePlayStore.getState().log.map((event) => event.code)).toEqual([
      "MOVED",
      "DOOR_LOCKED",
    ]);

    play.act({ type: "INTERACT", entityId: "key1" });
    expect(usePlayStore.getState().lastRefused).toBeNull();
  });

  it("playing the observatory's five-step run sets won", () => {
    const play = usePlayStore.getState();
    play.start(observatory);
    for (const action of winningRun) expect(play.act(action)?.ok).toBe(true);

    expect(usePlayStore.getState().state?.won).toBe(true);
    expect(usePlayStore.getState().log.at(-1)?.code).toBe("GOAL_COMPLETE");
  });

  it("reset starts fresh and clears events and refusals", () => {
    const play = usePlayStore.getState();
    play.start(observatory);
    for (const action of winningRun) play.act(action);
    play.act({ type: "WAIT", ticks: 1 });
    play.reset();

    expect(usePlayStore.getState().state).toEqual(
      createInitialState(observatory, observatory.seed),
    );
    expect(usePlayStore.getState().log).toEqual([]);
    expect(usePlayStore.getState().lastRefused).toBeNull();
  });

  it("starting a different revision clears the previous play session", () => {
    const play = usePlayStore.getState();
    play.start(observatory);
    for (const action of winningRun) play.act(action);
    play.start(observatoryKeyBehindDoor);

    expect(usePlayStore.getState().state).toEqual(
      createInitialState(observatoryKeyBehindDoor, observatoryKeyBehindDoor.seed),
    );
    expect(usePlayStore.getState().log).toEqual([]);
    expect(usePlayStore.getState().lastRefused).toBeNull();
  });
});

describe("versioned projects", () => {
  it("undo returns to the previous version and redo comes back", () => {
    const project = useProjectStore.getState();
    const first = version(observatory);
    const second = version(observatoryKeyBehindDoor);
    project.addVersion(first);
    project.addVersion(second);
    project.undo();
    expect(project.active()).toEqual(first);
    project.redo();
    expect(project.active()).toEqual(second);
    expect(useProjectStore.getState().versions).toEqual([first, second]);
  });

  it("empty history, unknown selection and history boundaries are harmless", () => {
    const project = useProjectStore.getState();
    project.undo();
    project.redo();
    project.select("missing");
    expect(project.active()).toBeNull();
    project.addVersion(version(observatory));
    project.undo();
    project.redo();
    project.select("missing");
    expect(project.active()?.id).toBe("version-1");
  });

  it("retains later versions when adding a revision after undo", () => {
    const project = useProjectStore.getState();
    const first = version(observatory);
    const second = version(observatoryKeyBehindDoor);
    const third = { ...second, id: "third-version" };
    project.addVersion(first);
    project.addVersion(second);
    project.undo();
    project.addVersion(third);
    expect(useProjectStore.getState().versions).toEqual([first, second, third]);
    project.select(first.id);
    project.redo();
    expect(project.active()).toEqual(second);
  });

  it("reports are keyed by revision hash and survive undo", () => {
    const project = useProjectStore.getState();
    const first = version(observatory);
    const second = version(observatoryKeyBehindDoor);
    const report = failedReport(observatoryKeyBehindDoor);
    project.addVersion(first);
    project.addVersion(second);
    project.recordReport(report);
    project.undo();

    expect(useProjectStore.getState().reports[second.revisionHash]).toEqual(report);
    expect(useProjectStore.getState().reports[first.revisionHash]).toBeUndefined();
    project.redo();
    expect(useProjectStore.getState().reports[second.revisionHash]).toEqual(report);
  });

  it("keeps snapshots independent from the supplied version and report", () => {
    const project = useProjectStore.getState();
    const input = structuredClone(version(observatory));
    const report = failedReport(observatory);
    project.addVersion(input);
    project.recordReport(report);
    input.world.title = "Changed outside the store";
    report.failureReason = "Changed outside the store";

    expect(project.active()?.world.title).toBe(observatory.title);
    expect(useProjectStore.getState().reports[report.worldRevisionHash]?.failureReason).toBe(
      "Report storage test fixture",
    );
  });
});
