import { create } from "zustand";
import type { TestStatus } from "../contract/codes.js";
import type { GameState } from "../contract/game.schema.js";
import type { TraceStep, VerificationReport } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { startTestRun, type TestRunHandle } from "../agents/test-runner.js";
import { stepGame } from "../domain/step-game.js";
import { reportStatusFor } from "../verification/report.js";
import { useProjectStore } from "./project-store.js";
import type { WorldVersion } from "./types.js";

export type PacedStep = { step: TraceStep; summary: string; state: GameState };

export type TestRun = {
  revisionHash: string;
  steps: PacedStep[];
  shown: number;
  report: VerificationReport | null;
  status: "running" | "done" | "cancelled";
};

export type TestRunner = (world: WorldSpec, seed: number) => TestRunHandle;

export type TestStore = {
  run: TestRun | null;
  current(): PacedStep | null;
  start(version: WorldVersion, runner?: TestRunner): void;
  cancel(): void;
  bindTo(version: WorldVersion | null): void;
  statusFor(version: WorldVersion): TestStatus | null;
  inspected: string[];
  inspect(entityIds: string[]): void;
  highlightIds(): string[];
};

export type TestStoreDeps = {
  every: (intervalMs: number, tick: () => void) => () => void;
  reducedMotion: () => boolean;
  onReport: (report: VerificationReport) => void;
};

export const stepIntervalMs = 350;

export function createTestStore(deps: TestStoreDeps) {
  return create<TestStore>()((set, get) => {
    let handle: TestRunHandle | null = null;
    let stopTicker: (() => void) | null = null;
    let pending: VerificationReport | null = null;
    let instant = false;
    let world: WorldSpec | null = null;

    function refusedHighlights(): string[] {
      const { run } = get();
      if (run === null || world === null) return [];
      const refused = run.steps.slice(0, run.shown).findLast((item) => !item.step.accepted);
      if (refused === undefined) return [];
      return stepGame(world, refused.state, refused.step.action).event.affectedIds;
    }

    function update(change: Partial<TestRun>) {
      const { run } = get();
      if (run !== null) set({ run: { ...run, ...change } });
    }

    function halt() {
      stopTicker?.();
      stopTicker = null;
    }

    function finishIfShown() {
      const { run } = get();
      if (run?.status !== "running" || pending === null || run.shown < run.steps.length) return;
      const report = pending;
      pending = null;
      handle = null;
      halt();
      update({ report, status: "done" });
      deps.onReport(report);
    }

    function tick() {
      const { run } = get();
      if (run !== null && run.shown < run.steps.length) update({ shown: run.shown + 1 });
      finishIfShown();
    }

    function cancel() {
      const current = handle;
      handle = null;
      pending = null;
      halt();
      current?.cancel();
      if (get().run?.status === "running") update({ status: "cancelled" });
    }

    function start(version: WorldVersion, runner: TestRunner = startTestRun) {
      cancel();
      instant = deps.reducedMotion();
      world = version.world;
      set({
        inspected: [],
        run: {
          revisionHash: version.revisionHash,
          steps: [],
          shown: 0,
          report: null,
          status: "running",
        },
      });
      const own = runner(version.world, version.world.seed);
      handle = own;
      own.onStep((step, summary, state) => {
        const { run } = get();
        if (handle !== own || run === null) return;
        const steps = [...run.steps, { step, summary, state }];
        update({ steps, shown: instant ? steps.length : run.shown });
      });
      void own.done.then((report) => {
        if (handle !== own) return;
        pending = report;
        finishIfShown();
      });
      if (!instant) stopTicker = deps.every(stepIntervalMs, tick);
    }

    return {
      run: null,
      current: () => {
        const { run } = get();
        if (run === null || run.shown === 0) return null;
        return run.steps[run.shown - 1] ?? null;
      },
      start,
      cancel,
      bindTo: (version) => {
        const { run } = get();
        if (run?.status === "running" && run.revisionHash !== version?.revisionHash) cancel();
      },
      statusFor: (version) => {
        const report = get().run?.report ?? null;
        return report === null ? null : reportStatusFor(version.world, report);
      },
      inspected: [],
      inspect: (entityIds) => {
        set({ inspected: [...entityIds] });
      },
      highlightIds: () => {
        const { inspected } = get();
        return inspected.length > 0 ? inspected : refusedHighlights();
      },
    };
  });
}

export const useTestStore = createTestStore({
  every: (intervalMs, tick) => {
    const id = setInterval(tick, intervalMs);
    return () => {
      clearInterval(id);
    };
  },
  reducedMotion: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  onReport: (report) => {
    useProjectStore.getState().recordReport(report);
  },
});
