import { get, set } from "idb-keyval";
import { z } from "zod";
import { generationModes, repairModes } from "../contract/codes.js";
import { worldPatchSchema } from "../contract/patch.schema.js";
import { verificationReportSchema } from "../contract/report.schema.js";
import { worldSpecSchema } from "../contract/world.schema.js";
import { worldRevisionHash } from "../domain/canonical.js";
import { verifyReportIntegrity } from "../verification/report.js";
import type { WorldVersion } from "./types.js";

export const worldVersionSchema = z
  .strictObject({
    id: z.string().min(1),
    world: worldSpecSchema,
    revisionHash: z.string(),
    source: z.enum(["example", "generated", "edited", "repaired"]),
    origin: z.enum([...generationModes, ...repairModes]),
    modelId: z.string().nullable(),
    parentHash: z.string().nullable(),
    patch: worldPatchSchema.nullable(),
    instruction: z.string(),
    createdAt: z.iso.datetime(),
  })
  .refine(
    (version) => version.revisionHash === worldRevisionHash(version.world),
    "The revision hash does not match the world",
  );

const finishedReportSchema = verificationReportSchema.refine(
  (report) =>
    report.status !== "RUNNING" && report.status !== "QUEUED" && verifyReportIntegrity(report),
  "Only finished reports with intact evidence can be restored",
);

export const persistedProjectSchema = z
  .strictObject({
    versions: z.array(worldVersionSchema).max(50),
    activeId: z.string().nullable(),
    reports: z.record(z.string(), finishedReportSchema),
  })
  .superRefine((project, context) => {
    const ids = project.versions.map((version) => version.id);
    if (
      new Set(ids).size !== ids.length ||
      (project.activeId !== null && !ids.includes(project.activeId))
    ) {
      context.addIssue({
        code: "custom",
        message: "The active revision or version history is invalid",
      });
    }
    for (const [hash, report] of Object.entries(project.reports)) {
      if (hash !== report.worldRevisionHash)
        context.addIssue({
          code: "custom",
          message: "A report is filed under a different revision",
        });
    }
  });

export type PersistedProject = z.infer<typeof persistedProjectSchema>;
export type ProjectStorage = {
  get: () => Promise<unknown>;
  set: (project: unknown) => Promise<void>;
};

export const browserProjectStorage: ProjectStorage = {
  get: () => get<unknown>("vect-project-v1"),
  set: (project) => set("vect-project-v1", project),
};

function boundedProject(project: PersistedProject): PersistedProject {
  const versions = project.versions.slice(-50);
  const active = project.versions.find((version) => version.id === project.activeId);
  if (active && !versions.some((version) => version.id === active.id)) versions[0] = active;
  const relevant = new Set(
    versions.flatMap((version) => [version.revisionHash, version.parentHash]),
  );
  const reports = Object.fromEntries(
    Object.entries(project.reports).filter(([hash]) => relevant.has(hash)),
  );
  return { versions, activeId: project.activeId, reports };
}

export async function saveProject(
  storage: ProjectStorage,
  project: PersistedProject,
): Promise<{ notice: string | null }> {
  const parsed = persistedProjectSchema.safeParse(boundedProject(project));
  if (!parsed.success)
    return {
      notice: "This project could not be saved because its history or reports are invalid.",
    };
  try {
    await storage.set(parsed.data);
    return { notice: null };
  } catch {
    return { notice: "This browser could not save your project. Export the world to keep a copy." };
  }
}

export async function loadProject(
  storage: ProjectStorage,
): Promise<{ project: PersistedProject | null; notice: string | null }> {
  try {
    const data = await storage.get();
    if (data === undefined || data === null) return { project: null, notice: null };
    const parsed = persistedProjectSchema.safeParse(data);
    return parsed.success
      ? { project: parsed.data, notice: null }
      : {
          project: null,
          notice:
            "The saved project could not be restored because its data was invalid. You can start a new world.",
        };
  } catch {
    return {
      project: null,
      notice: "Local storage could not be read. You can still use Vect in this session.",
    };
  }
}

export function exportBundle(
  version: WorldVersion,
  report: z.infer<typeof verificationReportSchema> | null,
): Blob {
  const parsedVersion = worldVersionSchema.parse(version);
  const parsedReport = report === null ? null : finishedReportSchema.parse(report);
  if (parsedReport && parsedReport.worldRevisionHash !== parsedVersion.revisionHash) {
    throw new Error("This report belongs to a different world revision.");
  }
  return new Blob(
    [
      JSON.stringify(
        {
          world: parsedVersion.world,
          revisionHash: parsedVersion.revisionHash,
          report: parsedReport,
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
}
