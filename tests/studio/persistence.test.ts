import { describe, expect, it } from "vitest";
import { makeVersion } from "../../src/app/versions.js";
import { observatory } from "../../src/fixtures/observatory.js";
import {
  exportBundle,
  loadProject,
  persistedProjectSchema,
  saveProject,
  type ProjectStorage,
} from "../../src/store/persistence.js";
import { verifyWorld } from "../../src/verification/verify.js";

function memoryStorage(): ProjectStorage {
  const values = new Map<string, unknown>();
  return {
    get: () => Promise.resolve(values.get("project")),
    set: (value) => {
      values.set("project", structuredClone(value));
      return Promise.resolve();
    },
  };
}

function fixtureProject() {
  const version = makeVersion(observatory, "example", "sample_fixture", null);
  const report = verifyWorld(observatory, {
    seed: observatory.seed,
    now: () => 0,
    isoNow: () => observatory.metadata.createdAt,
  });
  return { versions: [version], activeId: version.id, reports: { [version.revisionHash]: report } };
}

describe("project persistence", () => {
  it("round-trips versions and reports", async () => {
    const storage = memoryStorage();
    const project = fixtureProject();
    expect(await saveProject(storage, project)).toEqual({ notice: null });
    expect(await loadProject(storage)).toEqual({ project, notice: null });
  });

  it("corrupt data gives null plus a notice, never a throw", async () => {
    const storage = memoryStorage();
    await storage.set({ versions: "broken", activeId: 123 });
    const result = await loadProject(storage);
    expect(result.project).toBeNull();
    expect(result.notice).toContain("could not be restored");
  });

  it("a persisted RUNNING state is impossible by schema", () => {
    const project = fixtureProject();
    const report = Object.values(project.reports)[0];
    expect(
      persistedProjectSchema.safeParse({
        ...project,
        reports: { "running-report": { ...report, status: "RUNNING" } },
      }).success,
    ).toBe(false);
  });

  it("rejects a modified world hash or a tampered report", () => {
    const project = fixtureProject();
    const version = project.versions[0];
    const report = Object.values(project.reports)[0];
    expect(
      persistedProjectSchema.safeParse({
        ...project,
        versions: [{ ...version, revisionHash: "tampered" }],
      }).success,
    ).toBe(false);
    expect(
      persistedProjectSchema.safeParse({
        ...project,
        reports: { [observatory.id]: { ...report, initialSeed: 1 } },
      }).success,
    ).toBe(false);
  });

  it("storage failures return notices", async () => {
    const storage: ProjectStorage = {
      get: () => Promise.reject(new Error("Unavailable")),
      set: () => Promise.reject(new Error("Quota exceeded")),
    };
    expect((await loadProject(storage)).notice).toBeTruthy();
    expect((await saveProject(storage, fixtureProject())).notice).toBeTruthy();
  });

  it("keeps the active revision within a bounded saved history", async () => {
    const project = fixtureProject();
    const first = project.versions[0];
    if (!first) throw new Error("The fixture version is missing");
    project.versions = Array.from({ length: 55 }, (_, index) => ({
      ...first,
      id: `version-${String(index)}`,
    }));
    project.activeId = "version-0";
    const storage = memoryStorage();
    await saveProject(storage, project);
    const restored = await loadProject(storage);
    expect(restored.project?.versions).toHaveLength(50);
    expect(restored.project?.versions.some((version) => version.id === "version-0")).toBe(true);
    expect(restored.project?.versions.at(-1)?.id).toBe("version-54");
    expect(project.versions).toHaveLength(55);
  });

  it("exports a world and the exact report without transient run data", async () => {
    const project = fixtureProject();
    const version = project.versions[0];
    const report = Object.values(project.reports)[0];
    if (!version || !report) throw new Error("The fixture evidence is missing");
    const blob = exportBundle(version, report);
    const content = await blob.text();
    expect(blob.type).toBe("application/json");
    expect(content).toContain(report.reportDigest);
    expect(content).toContain(version.revisionHash);
    expect(content).toContain(observatory.title);
    expect(content).not.toContain('"run"');
  });
});
