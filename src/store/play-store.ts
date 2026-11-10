import { create } from "zustand";
import type { WorldSpec } from "../contract/world.schema.js";
import { createInitialState, stepGame } from "../domain/step-game.js";
import type { PlayStore } from "./types.js";

export const usePlayStore = create<PlayStore>()((set, get) => {
  let world: WorldSpec | null = null;

  function reset() {
    if (!world) return;
    set({
      state: createInitialState(world, world.seed),
      log: [],
      lastRefused: null,
    });
  }

  return {
    state: null,
    log: [],
    lastRefused: null,
    start: (nextWorld) => {
      world = structuredClone(nextWorld);
      reset();
    },
    act: (action) => {
      const { state } = get();
      if (!world || !state) return null;
      const transition = stepGame(world, state, action);
      set((play) => ({
        state: transition.state,
        log: [...play.log, transition.event],
        lastRefused: transition.ok ? null : transition.event,
      }));
      return transition;
    },
    reset,
  };
});
