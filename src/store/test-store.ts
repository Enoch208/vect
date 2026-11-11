import { create } from "zustand";
import type { TestStatus } from "../contract/codes.js";
import type { GameState } from "../contract/game.schema.js";
import type { TraceStep, VerificationReport } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { startTestRun, type TestRunHandle } from "../agents/test-runner.js";
import { placeholderReport, type StepListener } from "../agents/test-session.js";
import { worldRevisionHash } from "../domain/canonical.js";
import { createInitialState, stepGame } from "../domain/step-game.js";
import { reportStatusFor } from "../verification/report.js";
import { useProjectStore } from "./project-store.js";
import type { WorldVersion } from "./types.js";

export type PacedStep = { step: TraceStep; summary: string; state: GameState };

export type TestRun = {
  revisionHash: string;
  world: WorldSpec;
  seed: number;
  steps: PacedStep[];
  shown: number;
  report: VerificationReport | null;
  status: "running" | "done" | "cancelled";
};

export type TestRunner = (world: WorldSpec, seed: number) => TestRunHandle;

export type Viewport = {
  revisionHash: string;
  world: WorldSpec;
  state: GameState;
  path: Array<{ x: number; z: number }>;
  highlightIds: string[];
};

export type TestStore = {
  run: TestRun | null;
  current: () => PacedStep | null;
  start: (version: WorldVersion, runner?: TestRunner) => void;
  track: (world: WorldSpec, seed: number, runner?: TestRunner) => TestRunHandle;
  cancel: () => void;
  bindTo: (version: WorldVersion | null) => void;
  statusFor: (version: WorldVersion) => TestStatus | null;
  inspected: string[];
  inspect: (entityIds: string[]) => void;
  highlightIds: () => string[];
  viewport: () => Viewport | null;
};

export type TestStoreDeps = {
  every: (intervalMs: number, tick: () => void) => () => void;
  reducedMotion: () => boolean;
  onReport: (report: VerificationReport) => void;
  isoNow: () => string;
};

type Tracked = { settle: (report: VerificationReport) => void; listeners: Set<StepListener> };

export const stepIntervalMs = 350;

export function createTestStore(deps: TestStoreDeps) {
  return create<TestStore>()((set, get) => {
    let handle: TestRunHandle | null = null;
    let stopTicker: (() => void) | null = null;
    let pending: VerificationReport | null = null;
    let instant = false;
    let initial: GameState | null = null;
    let tracked: Tracked | null = null;

    function update(change: Partial<TestRun>) {
      const { run } = get();
      if (run !== null) set({ run: { ...run, ...change } });
    }

    function reveal(steps: PacedStep[], from: number, to: number) {
      update({ steps, shown: to });
      for (const item of steps.slice(from, to)) {
        for (const listener of tracked?.listeners ?? [])
          listener(item.step, item.summary, item.state);
      }
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
      tracked?.settle(report);
      tracked = null;
    }

    function tick() {
      const { run } = get();
      if (run !== null && run.shown < run.steps.length) reveal(run.steps, run.shown, run.shown + 1);
      finishIfShown();
    }

    function cancel() {
      const current = handle;
      const { run } = get();
      handle = null;
      pending = null;
      halt();
      current?.cancel();
      if (run?.status === "running") update({ status: "cancelled" });
      if (tracked !== null && run !== null) {
        const reason = "The test was cancelled before it finished.";
        tracked.settle(placeholderReport(run.world, run.seed, deps.isoNow, "CANCELLED", reason));
      }
      tracked = null;
    }

    function begin(world: WorldSpec, seed: number, runner: TestRunner) {
      cancel();
      instant = deps.reducedMotion();
      initial = createInitialState(world, seed);
      const revisionHash = worldRevisionHash(world);
      set({
        inspected: [],
        run: { revisionHash, world, seed, steps: [], shown: 0, report: null, status: "running" },
      });
      const own = runner(world, seed);
      handle = own;
      own.onStep((step, summary, state) => {
        const { run } = get();
        if (handle !== own || run === null) return;
        const steps = [...run.steps, { step, summary, state }];
        if (instant) reveal(steps, run.shown, steps.length);
        else update({ steps });
      });
      void own.done.then((report) => {
        if (handle !== own) return;
        pending = report;
        finishIfShown();
      });
      if (!instant) stopTicker = deps.every(stepIntervalMs, tick);
    }

    function track(world: WorldSpec, seed: number, runner: TestRunner = startTestRun) {
      begin(world, seed, runner);
      const own: Tracked = { settle: () => undefined, listeners: new Set() };
      const done = new Promise<VerificationReport>((resolve) => {
        own.settle = resolve;
      });
      tracked = own;
      return {
        onStep: (listener: StepListener) => {
          own.listeners.add(listener);
          return () => own.listeners.delete(listener);
        },
        done,
        cancel: () => {
          if (tracked === own) cancel();
        },
      };
    }

    function highlightIds(): string[] {
      const { run, inspected } = get();
      if (inspected.length > 0) return inspected;
      const refused = run?.steps.slice(0, run.shown).findLast((item) => !item.step.accepted);
      if (run === null || refused === undefined) return [];
      return stepGame(run.world, refused.state, refused.step.action).event.affectedIds;
    }

    return {
      run: null,
      current: () => {
        const { run } = get();
        if (run === null || run.shown === 0) return null;
        return run.steps[run.shown - 1] ?? null;
      },
      start: (version, runner = startTestRun) => {
        begin(version.world, version.world.seed, runner);
      },
      track,
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
      highlightIds,
      viewport: () => {
        const { run } = get();
        if (run === null || initial === null) return null;
        const shown = run.steps.slice(0, run.shown);
        return {
          revisionHash: run.revisionHash,
          world: run.world,
          state: shown.at(-1)?.state ?? initial,
          path: [initial.position, ...shown.map((item) => item.state.position)],
          highlightIds: highlightIds(),
        };
      },
    };
  });
}

const browserDeps: TestStoreDeps = {
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
  isoNow: () => new Date().toISOString(),
};

export const useTestStore = createTestStore(browserDeps);

export const useRepairRunStore = createTestStore(browserDeps);
