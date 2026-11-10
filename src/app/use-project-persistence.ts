import { useEffect, useState } from "react";
import { browserProjectStorage, loadProject, saveProject } from "../store/persistence.js";
import { usePlayStore } from "../store/play-store.js";
import { useProjectStore } from "../store/project-store.js";
import { observatory } from "../fixtures/observatory.js";
import { makeVersion } from "./versions.js";

export function useProjectPersistence(openExample: boolean) {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => void) | null = null;
    let writes = Promise.resolve();

    function scheduleSave() {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        const { versions, activeId, reports } = useProjectStore.getState();
        const snapshot = { versions, activeId, reports };
        writes = writes.then(async () => {
          const result = await saveProject(browserProjectStorage, snapshot);
          if (mounted && result.notice) setNotice(result.notice);
        });
      }, 500);
    }

    void loadProject(browserProjectStorage).then((result) => {
      if (!mounted) return;
      if (result.notice) setNotice(result.notice);
      const current = useProjectStore.getState();
      if (current.versions.length === 0 && result.project) {
        useProjectStore.setState(result.project);
        const active = useProjectStore.getState().active();
        if (active) usePlayStore.getState().start(active.world);
      }
      if (openExample) {
        const example = makeVersion(observatory, "example", "sample_fixture", null);
        useProjectStore.getState().addVersion(example);
        usePlayStore.getState().start(example.world);
        window.history.replaceState(null, "", "/studio");
      }
      unsubscribe = useProjectStore.subscribe(scheduleSave);
      if (useProjectStore.getState().versions.length > 0) scheduleSave();
    });

    return () => {
      mounted = false;
      unsubscribe?.();
      if (timer !== null) clearTimeout(timer);
    };
  }, [openExample]);

  return {
    notice,
    dismiss: () => {
      setNotice(null);
    },
  };
}
