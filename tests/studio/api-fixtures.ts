import type { GenerateRequest, GenerateResponse } from "../../src/contract/api.schema.js";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatory } from "../../src/fixtures/observatory.js";

export const generateRequest: GenerateRequest = {
  prompt: "Build an observatory with a key and a locked control room.",
  theme: null,
  difficulty: null,
  clientRequestId: "837b4337-6acb-4cb0-bb67-018a7f0fce63",
};

export const generateResponse: GenerateResponse = {
  requestId: "client-test-request",
  mode: "sample_fixture",
  modelId: null,
  world: observatory,
  revisionHash: worldRevisionHash(observatory),
  adaptations: [],
  solvability: { status: "SOLVABLE", findings: [], exploredStates: 0 },
  durationMs: 0,
};

export function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Deferred promise has not initialized");
  };
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
