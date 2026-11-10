import { handleTestRequest, type TestClock } from "./test-protocol.js";

const wallClock: TestClock = {
  now: () => performance.now(),
  isoNow: () => new Date().toISOString(),
};

globalThis.addEventListener("message", (event: MessageEvent<unknown>) => {
  handleTestRequest(
    event.data,
    (message) => {
      globalThis.postMessage(message);
    },
    wallClock,
  );
});
