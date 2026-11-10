import { useEffect, useMemo, useRef } from "react";
import type { WorldSceneProps } from "./types.js";

export type SceneHandlers = Pick<WorldSceneProps, "onMoveTo" | "onInteract" | "onSelect">;

export function useStableHandlers(props: SceneHandlers): SceneHandlers {
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });
  return useMemo(
    () => ({
      onMoveTo: (roomId) => {
        latest.current.onMoveTo(roomId);
      },
      onInteract: (entityId) => {
        latest.current.onInteract(entityId);
      },
      onSelect: (entityId) => {
        latest.current.onSelect(entityId);
      },
    }),
    [],
  );
}
