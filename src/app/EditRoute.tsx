import type { ApiClient } from "../store/api-client.js";
import { usePlayStore } from "../store/play-store.js";
import { useProjectStore } from "../store/project-store.js";
import { useTestStore } from "../store/test-store.js";
import type { WorldVersion } from "../store/types.js";
import { EditPanel } from "../components/studio/EditPanel.js";
import type { ScreenEvent } from "./screen.js";

export function EditRoute({
  api,
  version,
  selectedEntityIds,
  onScreen,
}: {
  api: ApiClient;
  version: WorldVersion;
  selectedEntityIds: string[];
  onScreen: (event: ScreenEvent) => void;
}) {
  return (
    <EditPanel
      key={version.id}
      api={api}
      version={version}
      selectedEntityIds={selectedEntityIds}
      onPreview={() => {
        onScreen({ type: "PREVIEW_PATCH" });
      }}
      onApply={(candidate) => {
        useTestStore.getState().cancel();
        useProjectStore.getState().addVersion(candidate);
        usePlayStore.getState().start(candidate.world);
        onScreen({ type: "APPLY_PATCH" });
      }}
      onDiscard={() => {
        onScreen({ type: "DISCARD_PATCH" });
      }}
      onClose={() => {
        onScreen({ type: "RETURN" });
      }}
    />
  );
}
