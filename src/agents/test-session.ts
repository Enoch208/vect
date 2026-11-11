import type { TestStatus } from "../contract/codes.js";
import type { GameState } from "../contract/game.schema.js";
import type { TraceStep, VerificationReport } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { sha256Hex, worldRevisionHash } from "../domain/canonical.js";
import { buildReport, verifyReportIntegrity } from "../verification/report.js";
import {
  testWorkerMessageSchema,
  type TestClock,
  type TestRequest,
  type TestWorkerMessage,
} from "./test-protocol.js";

export type StepListener = (step: TraceStep, summary: string, state: GameState) => void;

export type TestRunHandle = {
  onStep(listener: StepListener): () => void;
  done: Promise<VerificationReport>;
  cancel(): void;
};

export type WorkerPort = {
  send(request: TestRequest): void;
  listen(onMessage: (message: unknown) => void, onFailure: (reason: string) => void): void;
  close(): void;
};

type Streamed = Extract<TestWorkerMessage, { type: "step" }>;

const assertionIds = [
  "schema-valid",
  "structure-sound",
  "solver-solvable",
  "agent-reached-goal",
  "replay-matches",
  "invariants-hold",
];

export function placeholderReport(
  world: WorldSpec,
  seed: number,
  isoNow: () => string,
  status: Extract<TestStatus, "CANCELLED" | "ERROR">,
  failureReason: string,
): VerificationReport {
  const revisionHash = worldRevisionHash(world);
  const createdAt = isoNow();
  return buildReport({
    reportId: sha256Hex(revisionHash + String(seed) + createdAt).slice(0, 16),
    createdAt,
    worldId: world.id,
    worldRevisionHash: revisionHash,
    initialSeed: seed,
    agentMode: "heuristic_agent",
    status,
    assertions: assertionIds.map((id) => ({ id, passed: false, evidenceStep: null })),
    findings: [],
    trace: [],
    exploredStates: null,
    elapsedMs: 0,
    failureReason,
    replayPass: false,
  });
}

function trusted(world: WorldSpec, seed: number, report: VerificationReport): boolean {
  return (
    verifyReportIntegrity(report) &&
    report.worldRevisionHash === worldRevisionHash(world) &&
    report.initialSeed === seed
  );
}

export function connectTestRun(
  port: WorkerPort,
  world: WorldSpec,
  seed: number,
  clock: TestClock,
): TestRunHandle {
  const steps: Streamed[] = [];
  const listeners = new Set<StepListener>();
  let settle: (report: VerificationReport) => void = () => undefined;
  let settled = false;
  const done = new Promise<VerificationReport>((resolve) => {
    settle = resolve;
  });
  const finish = (report: VerificationReport) => {
    if (settled) return;
    settled = true;
    port.close();
    settle(report);
  };
  const fail = (reason: string) => {
    finish(placeholderReport(world, seed, clock.isoNow, "ERROR", reason));
  };
  port.listen(
    (raw) => {
      if (settled) return;
      const parsed = testWorkerMessageSchema.safeParse(raw);
      if (!parsed.success) {
        fail("The test worker sent a message the studio could not read.");
        return;
      }
      const message = parsed.data;
      if (message.type === "error") {
        fail(`The test worker reported an error: ${message.message}`);
        return;
      }
      if (message.type === "report") {
        if (trusted(world, seed, message.report)) {
          finish(message.report);
          return;
        }
        fail("The test worker returned a report that does not match this world revision.");
        return;
      }
      steps.push(message);
      for (const listener of listeners) listener(message.step, message.summary, message.state);
    },
    (reason) => {
      fail(`The test worker failed: ${reason}`);
    },
  );
  port.send({ type: "run", world, seed });
  return {
    onStep(listener) {
      for (const item of steps) listener(item.step, item.summary, item.state);
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    done,
    cancel() {
      finish(
        placeholderReport(
          world,
          seed,
          clock.isoNow,
          "CANCELLED",
          "The test was cancelled before it finished.",
        ),
      );
    },
  };
}
