import type { VerificationReport } from "../../contract/report.schema.js";
import type { WorldVersion } from "../../store/types.js";
import { StatusBadge } from "./StatusBadge.js";
import { badgeFor, versionStatus } from "./status.js";

export function RevisionPreview({
  version,
  reports,
  onNewWorld,
}: {
  version: WorldVersion;
  reports: Record<string, VerificationReport>;
  onNewWorld: () => void;
}) {
  return (
    <main className="p-[26px]">
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-rule pb-6">
        <div className="space-y-4">
          <p className="studio-label text-muted">World revision {version.world.revision}</p>
          <h1 className="font-display text-[33.3px] leading-none font-semibold uppercase">
            {version.world.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={badgeFor(version)}
              {...(version.modelId ? { detail: version.modelId } : {})}
            />
            <StatusBadge status={versionStatus(version, reports)} />
          </div>
        </div>
        <button type="button" className="studio-button" onClick={onNewWorld}>
          Create another world
        </button>
      </div>
      <dl className="my-6 grid gap-4 font-mono text-label md:grid-cols-3">
        <div>
          <dt className="text-muted">REVISION</dt>
          <dd title={version.revisionHash}>{version.revisionHash.slice(0, 12)}</dd>
        </div>
        <div>
          <dt className="text-muted">SEED</dt>
          <dd>{version.world.seed}</dd>
        </div>
        <div>
          <dt className="text-muted">THEME</dt>
          <dd>{version.world.theme}</dd>
        </div>
      </dl>
      <p className="max-w-[720px] text-body text-ink-72">{version.instruction}</p>
      {version.world.metadata.adaptations.length > 0 && (
        <div className="mt-6 border border-rule p-4">
          <h2 className="studio-label">Adapted your request</h2>
          <ul className="mt-3 list-disc pl-5">
            {version.world.metadata.adaptations.map((adaptation) => (
              <li key={adaptation}>{adaptation}</li>
            ))}
          </ul>
        </div>
      )}
      <section className="mt-8 border-t border-rule">
        <h2 className="studio-label py-4">Rooms</h2>
        <ol className="grid border-t border-l border-rule md:grid-cols-4">
          {version.world.rooms.map((room, index) => (
            <li key={room.id} className="space-y-6 border-r border-b border-rule p-[26px]">
              <p className="studio-label text-muted">0{index + 1}</p>
              <h3 className="font-display text-xl font-semibold uppercase">{room.label}</h3>
              <p className="text-body-s text-muted">
                {version.world.entities
                  .filter((entity) => entity.roomId === room.id)
                  .map((entity) => entity.label)
                  .join(" · ") || "No entities"}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
