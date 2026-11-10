import { describe, expect, it } from "vitest";
import { worldRevisionHash } from "../../src/domain/canonical.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { generateWorld } from "../../src/generation/generate-world.js";
import { editWorld } from "../../src/generation/edit-world.js";
import { repairWorld } from "../../src/generation/repair-world.js";
import { screenRepair } from "../../src/generation/screen-repair.js";
import type { GenerationContext } from "../../src/generation/context.js";
import type { ModelClient } from "../../src/server/model-client.js";
import { HttpFailure } from "../../src/server/http.js";
import { checkWorld } from "../../src/verification/check-world.js";

const request = {
  prompt: "Build a locked observatory",
  theme: null,
  difficulty: null,
  clientRequestId: "ec76b1bc-b91b-481b-aa55-3591def692fa",
};
const plan = (world = observatory) => ({
  supported: true,
  unsupportedReason: null,
  suggestion: null,
  adaptations: [],
  world: {
    theme: world.theme,
    title: world.title,
    rooms: world.rooms,
    connections: world.connections,
    entities: world.entities,
    startRoomId: world.startRoomId,
    goal: world.goal,
  },
});

function context(outputs: unknown[] = []) {
  const inputs: string[] = [];
  const model: ModelClient = {
    complete(call) {
      inputs.push(call.input);
      return Promise.resolve({ value: call.schema.parse(outputs.shift()), modelId: "test-model" });
    },
  };
  const deps: GenerationContext = {
    model,
    requestId: "test-request",
    timeoutMs: 1000,
    now: () => 100,
    isoNow: () => observatory.metadata.createdAt,
  };
  return { deps, inputs };
}

const brokenHash = worldRevisionHash(observatoryKeyBehindDoor);
const relocation = {
  intent: "Move the key to the library",
  operations: [{ op: "moveEntity", entityId: "key1", toRoomId: "library", localPosition: null }],
};
const finding = {
  code: "CIRCULAR_DEPENDENCY" as const,
  entityIds: ["key1", "door1"],
  explanation: "The key is behind its own lock.",
};
const repairRequest = {
  world: observatoryKeyBehindDoor,
  baseRevisionHash: brokenHash,
  finding,
  maxAttempts: 3,
};

describe("live generation orchestration", () => {
  it("returns only a validated playable world with an honest origin and hash", async () => {
    const { deps, inputs } = context([plan()]);
    const result = await generateWorld(request, deps);
    expect(result.mode).toBe("live_ai");
    expect(result.revisionHash).toBe(worldRevisionHash(result.world));
    expect(result.solvability.status).toBe("SOLVABLE");
    expect(inputs).toHaveLength(1);
  });
  it("feeds actual validator findings into a single corrective retry", async () => {
    const { deps, inputs } = context([plan(observatoryKeyBehindDoor), plan()]);
    await generateWorld(request, deps);
    expect(inputs).toHaveLength(2);
    expect(inputs[1]).toContain("previous plan was rejected");
  });
  it("rejects two unsolvable answers instead of substituting a fixture", async () => {
    const { deps, inputs } = context([
      plan(observatoryKeyBehindDoor),
      plan(observatoryKeyBehindDoor),
    ]);
    await expect(generateWorld(request, deps)).rejects.toMatchObject({
      status: 422,
      code: "GENERATION_INVALID",
    });
    expect(inputs).toHaveLength(2);
  });
  it("explains unsupported requests and missing configuration", async () => {
    const { deps } = context([
      {
        supported: false,
        unsupportedReason: "No racing simulation",
        suggestion: "Try a locked-room puzzle",
        adaptations: [],
        world: null,
      },
    ]);
    await expect(generateWorld(request, deps)).rejects.toMatchObject({
      status: 400,
      suggestion: "Try a locked-room puzzle",
    });
    await expect(generateWorld(request, { ...deps, model: null })).rejects.toMatchObject({
      code: "MODEL_NOT_CONFIGURED",
    });
  });
});

describe("edits and bounded repairs", () => {
  it("preserves an intentionally broken edit for an independent test", async () => {
    const { deps } = context([
      {
        understood: true,
        clarification: null,
        patch: {
          intent: "Put the key behind its door",
          operations: [
            { op: "moveEntity", entityId: "key1", toRoomId: "control", localPosition: null },
          ],
        },
      },
    ]);
    const result = await editWorld(
      {
        world: observatory,
        baseRevisionHash: worldRevisionHash(observatory),
        instruction: "Put the key inside the room it unlocks",
        selectedEntityIds: [],
      },
      deps,
    );
    expect(result.solvability.status).toBe("PROVEN_UNREACHABLE");
    expect(result.warnings).not.toHaveLength(0);
  });
  it("rejects stale revisions before making a model call", async () => {
    const { deps, inputs } = context();
    await expect(
      repairWorld({ ...repairRequest, baseRevisionHash: "stale" }, deps),
    ).rejects.toMatchObject({ code: "STALE_REVISION" });
    await expect(
      editWorld(
        {
          world: observatory,
          baseRevisionHash: "stale",
          instruction: "Change the theme",
          selectedEntityIds: [],
        },
        deps,
      ),
    ).rejects.toMatchObject({ code: "STALE_REVISION" });
    expect(inputs).toHaveLength(0);
  });
  it("accepts relocation for fresh verification, without minting a report", async () => {
    const { deps } = context([relocation]);
    const result = await repairWorld(repairRequest, deps);
    expect(result.attempts[0]?.outcome).toBe("ACCEPTED_FOR_VERIFICATION");
    expect(result.attempts[0]?.mode).toBe("live_ai");
    expect(result.candidate && checkWorld(result.candidate).solvability?.status).toBe("SOLVABLE");
    expect(result).not.toHaveProperty("report");
  });
  it("records invalid targets and stops after three rejected proposals", async () => {
    const bad = {
      ...relocation,
      operations: [
        { op: "moveEntity", entityId: "missing", toRoomId: "library", localPosition: null },
      ],
    };
    const { deps } = context([bad, bad, bad]);
    const result = await repairWorld(repairRequest, deps);
    expect(result.candidate).toBeNull();
    expect(result.attempts).toHaveLength(3);
    expect(result.attempts.every((attempt) => attempt.outcome === "REJECTED_INVALID")).toBe(true);
  });
  it("labels local repairs honestly when the provider is absent or fails", async () => {
    const { deps } = context();
    const offline: ModelClient = {
      complete: () =>
        Promise.reject(new HttpFailure(503, "PROVIDER_UNAVAILABLE", true, null, "Offline")),
    };
    for (const model of [null, offline]) {
      const result = await repairWorld(repairRequest, { ...deps, model });
      expect(result.attempts[0]?.mode).toBe("deterministic_rule");
      expect(result.candidate).not.toBeNull();
    }
  });
  it("rejects goal bypasses and weakening an existing gate", () => {
    const patch = {
      baseRevisionHash: brokenHash,
      intent: "Bypass the puzzle",
      operations: [{ op: "setGoalPredicate" as const, predicate: { op: "true" as const } }],
    };
    expect(screenRepair(observatoryKeyBehindDoor, patch).outcome).toBe("REJECTED_INVALID");
    expect(
      screenRepair(observatoryKeyBehindDoor, {
        ...patch,
        operations: [
          {
            op: "setConnectionPredicate",
            connectionId: "c2",
            doorId: "door1",
            predicate: { op: "true" },
          },
        ],
      }).outcome,
    ).toBe("REJECTED_INTENT_BREAKING");
  });
});
