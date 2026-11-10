import type { WorldSpec } from "../contract/world.schema.js";
import type { TestClock } from "./test-protocol.js";
import { connectTestRun, type TestRunHandle, type WorkerPort } from "./test-session.js";

export type { StepListener, TestRunHandle } from "./test-session.js";

const wallClock: TestClock = {
  now: () => performance.now(),
  isoNow: () => new Date().toISOString(),
};

export function startTestRun(world: WorldSpec, seed: number): TestRunHandle {
  const worker = new Worker(new URL("./test-worker.js", import.meta.url), { type: "module" });
  const port: WorkerPort = {
    send: (request) => {
      worker.postMessage(request);
    },
    listen: (onMessage, onFailure) => {
      worker.addEventListener("message", (event: MessageEvent<unknown>) => {
        onMessage(event.data);
      });
      worker.addEventListener("error", (event) => {
        onFailure(event.message === "" ? "the worker script could not run" : event.message);
      });
      worker.addEventListener("messageerror", () => {
        onFailure("a message from the worker could not be read");
      });
    },
    close: () => {
      worker.terminate();
    },
  };
  return connectTestRun(port, world, seed, wallClock);
}
