import { describe, expect, it } from "vitest";
import type { VerificationReport } from "../../src/contract/report.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import {
  handleTestRequest,
  testWorkerMessageSchema,
  type TestWorkerMessage,
} from "../../src/agents/test-protocol.js";
import { connectTestRun, type WorkerPort } from "../../src/agents/test-session.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { verifyReportIntegrity } from "../../src/verification/report.js";

const clock = { now: () => 0, isoNow: () => "2026-11-10T20:00:00.000Z" };

function collect(message: unknown): TestWorkerMessage[] {
  const posted: TestWorkerMessage[] = [];
  handleTestRequest(message, (item) => posted.push(item), clock);
  return posted;
}

type FakePort = WorkerPort & { closed: boolean; deliver: (message: unknown) => void };

function fakePort(behave: (request: unknown, port: FakePort) => void): FakePort {
  let onMessage: (message: unknown) => void = () => undefined;
  const port: FakePort = {
    closed: false,
    send: (request) => {
      queueMicrotask(() => {
        behave(request, port);
      });
    },
    listen: (handler) => {
      onMessage = handler;
    },
    close: () => {
      port.closed = true;
    },
    deliver: (message) => {
      if (!port.closed) onMessage(message);
    },
  };
  return port;
}

const honestWorker = (request: unknown, port: FakePort) => {
  handleTestRequest(
    request,
    (message) => {
      port.deliver(message);
    },
    clock,
  );
};

function start(world: WorldSpec, behave: (request: unknown, port: FakePort) => void) {
  const port = fakePort(behave);
  return { port, handle: connectTestRun(port, world, 11, clock) };
}

describe("handleTestRequest", () => {
  it("posts steps then one report for the observatory", () => {
    const posted = collect({ type: "run", world: observatory, seed: 11 });
    const last = posted.at(-1);
    expect(last?.type).toBe("report");
    if (last?.type !== "report") return;
    expect(last.report.status).toBe("VERIFIED");
    const steps = posted.slice(0, -1);
    expect(steps.every((item) => item.type === "step")).toBe(true);
    expect(steps).toHaveLength(last.report.trace.length);
    for (const item of posted) expect(testWorkerMessageSchema.safeParse(item).success).toBe(true);
  });

  it("rejects a malformed request with an error message, not a throw", () => {
    for (const bad of [null, "run", { type: "run", world: {}, seed: 1 }, { type: "go" }]) {
      const posted = collect(bad);
      expect(posted).toHaveLength(1);
      expect(posted[0]?.type).toBe("error");
    }
  });
});

describe("connectTestRun", () => {
  it("streams steps and resolves with the worker's report", async () => {
    const { port, handle } = start(observatory, honestWorker);
    const seen: number[] = [];
    handle.onStep((step) => seen.push(step.index));
    const report = await handle.done;
    expect(report.status).toBe("VERIFIED");
    expect(seen).toEqual(report.trace.map((step) => step.index));
    expect(port.closed).toBe(true);
  });

  it("replays earlier steps to a late listener", async () => {
    const { handle } = start(observatoryKeyBehindDoor, honestWorker);
    const report = await handle.done;
    const seen: string[] = [];
    handle.onStep((_step, summary) => seen.push(summary));
    expect(report.status).toBe("FAILED");
    expect(seen).toHaveLength(report.trace.length);
  });

  it("cancel resolves done with a CANCELLED report and closes the worker", async () => {
    const { port, handle } = start(observatory, honestWorker);
    handle.cancel();
    const report = await handle.done;
    expect(report.status).toBe("CANCELLED");
    expect(verifyReportIntegrity(report)).toBe(true);
    expect(port.closed).toBe(true);
  });

  it("a worker failure resolves done with an ERROR report", async () => {
    const { handle } = start(observatory, (_request, port) => {
      port.deliver({ nonsense: true });
    });
    expect((await handle.done).status).toBe("ERROR");
  });

  it("a worker error message resolves done with an ERROR report", async () => {
    const { handle } = start(observatory, (_request, port) => {
      port.deliver({ type: "error", message: "boom" });
    });
    const report = await handle.done;
    expect(report.status).toBe("ERROR");
    expect(report.failureReason).toContain("boom");
  });

  it("a report for another revision or with a broken digest is not trusted", async () => {
    const forged = (report: VerificationReport) => ({ ...report, status: "VERIFIED" as const });
    const { handle } = start(observatoryKeyBehindDoor, (request, port) => {
      handleTestRequest(
        request,
        (message) => {
          port.deliver(
            message.type === "report"
              ? { type: "report", report: forged(message.report) }
              : message,
          );
        },
        clock,
      );
    });
    expect((await handle.done).status).toBe("ERROR");
  });
});
