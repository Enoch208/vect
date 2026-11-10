import { create } from "zustand";
import type { ProjectStore } from "./types.js";

export const useProjectStore = create<ProjectStore>()((set, get) => {
  function moveSelection(offset: number) {
    const { versions, activeId } = get();
    const index = versions.findIndex((version) => version.id === activeId);
    if (index < 0) return;
    const target = versions[index + offset];
    if (target) set({ activeId: target.id });
  }

  return {
    versions: [],
    activeId: null,
    reports: {},
    addVersion: (version) => {
      if (get().versions.some((existing) => existing.id === version.id)) return;
      const snapshot = structuredClone(version);
      set((project) => ({
        versions: [...project.versions, snapshot],
        activeId: snapshot.id,
      }));
    },
    select: (id) => {
      if (get().versions.some((version) => version.id === id)) set({ activeId: id });
    },
    undo: () => {
      moveSelection(-1);
    },
    redo: () => {
      moveSelection(1);
    },
    recordReport: (report) => {
      const snapshot = structuredClone(report);
      set((project) => ({
        reports: { ...project.reports, [snapshot.worldRevisionHash]: snapshot },
      }));
    },
    active: () => {
      const { versions, activeId } = get();
      return versions.find((version) => version.id === activeId) ?? null;
    },
  };
});
