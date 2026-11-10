import type { Screen, ScreenEvent } from "../../app/screen.js";
import { useProjectStore } from "../../store/project-store.js";
import type { WorldVersion } from "../../store/types.js";
import { ExportButton } from "./ExportButton.js";
import { StatusBadge } from "./StatusBadge.js";
import { badgeFor, versionStatus } from "./status.js";

type Props = {
  version: WorldVersion;
  screen: Screen;
  onScreen: (event: ScreenEvent) => void;
  onSelect: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onTest: () => void;
  onEdit: () => void;
  onHelp: () => void;
  reducedMotion: boolean;
  onMotion: () => void;
};

export function Toolbar(props: Props) {
  const { version } = props;
  const versions = useProjectStore((project) => project.versions);
  const reports = useProjectStore((project) => project.reports);
  const index = versions.findIndex((item) => item.id === version.id);
  const changing = ["editing", "pending_validation", "repairing", "retesting"].includes(
    props.screen,
  );
  return (
    <div className="border-b border-rule">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-xl leading-none font-semibold uppercase">
            {version.world.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={badgeFor(version)}
              {...(version.modelId ? { detail: version.modelId } : {})}
            />
            <StatusBadge status={versionStatus(version, reports, versions)} />
            <span className="font-mono text-micro uppercase text-muted">{version.world.theme}</span>
            <span
              className="font-mono text-micro tabular-nums text-muted"
              title={version.revisionHash}
            >
              {version.revisionHash.slice(0, 12)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={changing}
            className={
              props.screen === "playing" ? "studio-button" : "studio-button studio-button-primary"
            }
            onClick={() => {
              props.onScreen({ type: props.screen === "playing" ? "RETURN" : "PLAY" });
            }}
          >
            {props.screen === "playing" ? "Return to studio" : "Play"}
          </button>
          <button
            type="button"
            className="studio-button"
            title="Watch an agent solve the puzzle and verify its recorded run"
            disabled={changing}
            onClick={props.onTest}
          >
            Test
          </button>
          <button
            type="button"
            className="studio-button"
            title="Describe a change and preview it before applying"
            disabled={changing}
            onClick={props.onEdit}
          >
            Edit
          </button>
          {version.source === "repaired" && (
            <button
              type="button"
              className="studio-button"
              onClick={() => {
                props.onScreen({ type: "SHOW_PROOF" });
              }}
            >
              Proof
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="studio-label" htmlFor="world-version">
            Version
          </label>
          <select
            id="world-version"
            className="studio-field max-w-[190px] py-2 font-mono text-micro"
            value={version.id}
            onChange={(event) => {
              props.onSelect(event.target.value);
            }}
          >
            {versions.map((item, position) => (
              <option key={item.id} value={item.id}>
                v{position + 1} · {item.source}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="studio-button"
            disabled={index <= 0}
            onClick={props.onUndo}
          >
            Undo
          </button>
          <button
            type="button"
            className="studio-button"
            disabled={index >= versions.length - 1}
            onClick={props.onRedo}
          >
            Redo
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="studio-button"
            aria-pressed={props.reducedMotion}
            onClick={props.onMotion}
          >
            Reduced motion: {props.reducedMotion ? "On" : "Off"}
          </button>
          <button type="button" className="studio-button" onClick={props.onHelp}>
            Controls ?
          </button>
          <ExportButton version={version} report={reports[version.revisionHash] ?? null} />
        </div>
      </div>
    </div>
  );
}
