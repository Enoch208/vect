import { describe, expect, it } from "vitest";
import type { VerificationReport } from "../../src/contract/report.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { handleTestRequest } from "../../src/agents/test-protocol.js";
import { connectTestRun, type TestRunHandle } from "../../src/agents/test-session.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { createTestStore, type TestStoreDeps } from "../../src/store/test-store.js";
import type { WorldVersion } from "../../src/store/types.js";

const clock = { now: () => 0, isoNow: () => "2026-11-10T22:00:00.000Z" };

function versionOf(world: WorldSpec, id: string): WorldVersion {
  return {
    id,
    world,
    revisionHash: worldRevisionHash(world),
    source: "example",
    origin: "sample_fixture",
    modelId: null,
    parentHash: null,
    patch: null,
    instruction: "",
    createdAt: clock.isoNow(),
  };
}

const v1 = versionOf(observatory, "v1");
const v2 = versionOf(observatoryKeyBehindDoor, "v2");

function realRunner(calls: Array<{ world: WorldSpec; seed: number }> = []) {
  return (world: WorldSpec, seed: number): TestRunHandle => {
    calls.push({ world, seed });
    let deliver: (message: unknown) => void = () => undefined;
    return connectTestRun(
      {
        send: (request) => {
          queueMicrotask(() => {
            handleTestRequest(
              request,
              (message) => {
                deliver(message);
              },
              clock,
            );
          });
        },
        listen: (onMessage) => {
          deliver = onMessage;
        },
        close: () => {
          deliver = () => undefined;
        },
      },
      world,
      seed,
      clock,
    );
  };
}

function hangingRunner(cancelled: { count: number }) {
  return (): TestRunHandle => ({
    onStep: () => () => undefined,
    done: new Promise<VerificationReport>(() => undefined),
    cancel: () => {
      cancelled.count += 1;
    },
  });
}

type ManualTicker = {
  interval: number;
  tick: () => void;
  stopped: boolean;
  every: TestStoreDeps["every"];
};

function manualTicker(): ManualTicker {
  const ticker: ManualTicker = {
    interval: 0,
    tick: () => undefined,
    stopped: false,
    every: (ms, tick) => {
      ticker.interval = ms;
      ticker.tick = tick;
      ticker.stopped = false;
      return () => {
        ticker.stopped = true;
      };
    },
  };
  return ticker;
}

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

function storeWith(options: { reducedMotion?: boolean } = {}) {
  const ticker = manualTicker();
  const recorded: VerificationReport[] = [];
  const store = createTestStore({
    every: ticker.every,
    reducedMotion: () => options.reducedMotion ?? false,
    onReport: (report) => recorded.push(report),
  });
  return { store, ticker, recorded };
}

describe("the test store", () => {
  it("a run binds to the revision it started on", async () => {
    const { store } = storeWith({ reducedMotion: true });
    const calls: Array<{ world: WorldSpec; seed: number }> = [];
    store.getState().start(v1, realRunner(calls));
    expect(store.getState().run?.revisionHash).toBe(v1.revisionHash);
    expect(store.getState().run?.status).toBe("running");
    expect(calls).toEqual([{ world: v1.world, seed: v1.world.seed }]);
    await settle();
    expect(store.getState().run?.report?.worldRevisionHash).toBe(v1.revisionHash);
  });

  it("steps reveal one per 350 ms tick and all at once under reduced motion", async () => {
    const { store, ticker, recorded } = storeWith();
    store.getState().start(v1, realRunner());
    await settle();
    const total = store.getState().run?.steps.length ?? 0;
    expect(total).toBeGreaterThan(1);
    expect(ticker.interval).toBe(350);
    expect(store.getState().run?.shown).toBe(0);
    expect(store.getState().current()).toBeNull();
    ticker.tick();
    expect(store.getState().run?.shown).toBe(1);
    expect(store.getState().current()?.step.index).toBe(0);
    expect(store.getState().run?.report).toBeNull();
    for (let i = 1; i < total; i++) ticker.tick();
    expect(store.getState().run?.shown).toBe(total);
    expect(store.getState().run?.report?.status).toBe("VERIFIED");
    expect(store.getState().run?.status).toBe("done");
    expect(ticker.stopped).toBe(true);
    expect(recorded).toHaveLength(1);

    const reduced = storeWith({ reducedMotion: true });
    reduced.store.getState().start(v1, realRunner());
    await settle();
    expect(reduced.store.getState().run?.shown).toBe(total);
    expect(reduced.store.getState().run?.report?.status).toBe("VERIFIED");
  });

  it("switching version cancels the run and the new version is not green", async () => {
    const { store } = storeWith({ reducedMotion: true });
    const cancelled = { count: 0 };
    store.getState().start(v1, hangingRunner(cancelled));
    store.getState().bindTo(v2);
    expect(cancelled.count).toBe(1);
    expect(store.getState().run?.status).toBe("cancelled");
    expect(store.getState().statusFor(v2)).not.toBe("VERIFIED");

    store.getState().start(v1, realRunner());
    await settle();
    expect(store.getState().statusFor(v1)).toBe("VERIFIED");
    store.getState().bindTo(v2);
    expect(store.getState().statusFor(v2)).toBe("STALE");
  });

  it("after an edit the previous report reads STALE on the new version and VERIFIED again after undo", async () => {
    const { store } = storeWith({ reducedMotion: true });
    store.getState().start(v1, realRunner());
    await settle();
    expect(store.getState().statusFor(v1)).toBe("VERIFIED");
    expect(store.getState().statusFor(v2)).toBe("STALE");
    expect(store.getState().statusFor(v1)).toBe("VERIFIED");
  });

  it("ignores a late step or report from a run it already replaced", async () => {
    const { store } = storeWith({ reducedMotion: true });
    store.getState().start(v1, realRunner());
    store.getState().start(v2, realRunner());
    await settle();
    expect(store.getState().run?.revisionHash).toBe(v2.revisionHash);
    expect(store.getState().run?.report?.status).toBe("FAILED");
    expect(
      store.getState().run?.steps.every((item) => item.state.worldRevisionHash === v2.revisionHash),
    ).toBe(true);
  });

  it("holds nothing that could be persisted as a ghost Running state", () => {
    const { store } = storeWith();
    expect(store.getState().run).toBeNull();
    expect(store.getState().statusFor(v1)).toBeNull();
    expect(store.getState().highlightIds()).toEqual([]);
  });

  it("highlights what the engine named on the last refused step", async () => {
    const { store } = storeWith({ reducedMotion: true });
    store.getState().start(v2, realRunner());
    await settle();
    expect(store.getState().highlightIds()).toEqual(["c2", "door1"]);
  });

  it("inspecting a finding highlights its entities until the next run", async () => {
    const { store } = storeWith({ reducedMotion: true });
    store.getState().start(v2, realRunner());
    await settle();
    store.getState().inspect(["key1", "door1"]);
    expect(store.getState().highlightIds()).toEqual(["key1", "door1"]);
    store.getState().start(v1, realRunner());
    expect(store.getState().highlightIds()).toEqual([]);
  });
});
