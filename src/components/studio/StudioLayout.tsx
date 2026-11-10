import { useStudioSession } from "../../app/use-studio-session.js";
import type { Screen, ScreenEvent } from "../../app/screen.js";
import type { ApiClient } from "../../store/api-client.js";
import { usePlayStore } from "../../store/play-store.js";
import { useProjectStore } from "../../store/project-store.js";
import type { WorldVersion } from "../../store/types.js";
import { ControlsHelp } from "../game/ControlsHelp.js";
import { Hud } from "../game/Hud.js";
import { WonCard } from "../game/WonCard.js";
import { TestPanel } from "../test/TestPanel.js";
import { RepairPanel } from "../proof/RepairPanel.js";
import { ProofView } from "../proof/ProofView.js";
import { reportStatusFor } from "../../verification/report.js";
import { PromptHistory } from "./PromptHistory.js";
import { LastReport } from "./LastReport.js";
import { Inspector } from "./Inspector.js";
import { ScenePanel } from "./ScenePanel.js";
import { RoomActions } from "../game/RoomActions.js";
import { StatusBadge } from "./StatusBadge.js";
import { Toolbar } from "./Toolbar.js";
import { EditRoute } from "../../app/EditRoute.js";

export function StudioLayout({
  version,
  screen,
  onScreen,
  api,
}: {
  version: WorldVersion;
  screen: Screen;
  onScreen: (event: ScreenEvent) => void;
  api: ApiClient;
}) {
  const {
    play,
    test,
    selectedId,
    setSelectedId,
    helpOpen,
    setHelpOpen,
    motion,
    testing,
    repairing,
    editing,
    state,
    path,
    syncSelection,
    runTest,
    changeMode,
  } = useStudioSession(version, screen, onScreen);
  const versions = useProjectStore((project) => project.versions);
  const reports = useProjectStore((project) => project.reports);
  const before = versions.find((item) => item.revisionHash === version.parentHash);
  const repairReport = reports[version.revisionHash];
  const toolbar = (
    <Toolbar
      version={version}
      screen={screen}
      onScreen={changeMode}
      onSelect={(id) => {
        syncSelection(() => {
          useProjectStore.getState().select(id);
        });
      }}
      onUndo={() => {
        syncSelection(() => {
          useProjectStore.getState().undo();
        });
      }}
      onRedo={() => {
        syncSelection(() => {
          useProjectStore.getState().redo();
        });
      }}
      onTest={runTest}
      onEdit={() => {
        test.cancel();
        onScreen({ type: "EDIT" });
      }}
      onHelp={() => {
        setHelpOpen(true);
      }}
      reducedMotion={motion.reducedMotion}
      onMotion={motion.toggle}
    />
  );
  if (screen === "proof_view" && before)
    return (
      <main>
        {toolbar}
        <div className="p-[26px]">
          <ProofView
            before={before}
            after={version}
            onPlay={() => {
              onScreen({ type: "PLAY" });
            }}
          />
        </div>
      </main>
    );
  return (
    <main>
      {toolbar}
      {motion.notice && (
        <p
          role="status"
          className="flex items-center gap-3 border-b border-rule px-4 py-2 text-body-s"
        >
          <StatusBadge status="ERROR" />
          {motion.notice}
        </p>
      )}
      <div
        className={
          screen === "playing"
            ? "studio-workspace studio-workspace-play"
            : testing
              ? "studio-workspace studio-workspace-test"
              : editing
                ? "studio-workspace studio-workspace-edit"
                : "studio-workspace"
        }
      >
        {editing ? (
          <EditRoute
            api={api}
            version={version}
            selectedEntityIds={selectedId ? [selectedId] : []}
            onScreen={onScreen}
          />
        ) : (
          screen !== "playing" && !testing && <PromptHistory />
        )}
        <ScenePanel
          editing={editing}
          scene={{
            world: version.world,
            state,
            actor: testing ? "agent" : "player",
            path,
            highlightIds: testing ? test.highlightIds() : (play.lastRefused?.affectedIds ?? []),
            selectedEntityId: selectedId,
            interactive: !testing && !editing && !helpOpen,
            reducedMotion: motion.reducedMotion,
            onMoveTo: (roomId) => {
              play.act({ type: "MOVE_TO", roomId });
            },
            onInteract: (entityId) => {
              play.act({ type: "INTERACT", entityId });
            },
            onSelect: setSelectedId,
          }}
        >
          {!testing && !editing && state.won && <WonCard onReset={play.reset} onTest={runTest} />}
        </ScenePanel>
        {screen === "playing" && !helpOpen && (
          <aside className="space-y-5 overflow-y-auto border-l border-rule p-4 text-body">
            <p className="text-body-s text-muted">
              Use these buttons, or WASD / arrows to move and E to interact.
            </p>
            <RoomActions
              world={version.world}
              state={state}
              onMove={(roomId) => {
                play.act({ type: "MOVE_TO", roomId });
              }}
              onInteract={(entityId) => {
                play.act({ type: "INTERACT", entityId });
              }}
            />
            <button type="button" className="studio-button w-full" onClick={play.reset}>
              Restart puzzle
            </button>
          </aside>
        )}
        {screen !== "playing" &&
          !editing &&
          (repairing ? (
            repairReport && reportStatusFor(version.world, repairReport) === "FAILED" ? (
              <aside className="overflow-y-auto border-l border-rule p-4">
                <RepairPanel
                  version={version}
                  report={repairReport}
                  api={api}
                  onCommitted={(candidate) => {
                    useProjectStore.getState().addVersion(candidate);
                    usePlayStore.getState().start(candidate.world);
                    onScreen({ type: "SHOW_PROOF" });
                  }}
                />
              </aside>
            ) : (
              <LastReport version={version} />
            )
          ) : testing ? (
            <aside className="overflow-y-auto border-l border-rule p-4">
              <TestPanel
                version={version}
                onRepair={() => {
                  onScreen({ type: "REPAIR" });
                }}
              />
            </aside>
          ) : (
            <Inspector
              world={version.world}
              state={state}
              selectedId={selectedId}
              interactive={!helpOpen}
              onSelect={setSelectedId}
              onMove={(roomId) => {
                play.act({ type: "MOVE_TO", roomId });
              }}
              onInteract={(entityId) => {
                play.act({ type: "INTERACT", entityId });
              }}
            />
          ))}
      </div>
      <Hud
        world={version.world}
        state={state}
        lastEvent={testing ? null : (play.log.at(-1) ?? null)}
        refused={!testing && play.lastRefused !== null}
      />
      {helpOpen && (
        <ControlsHelp
          onClose={() => {
            setHelpOpen(false);
          }}
        />
      )}
    </main>
  );
}
