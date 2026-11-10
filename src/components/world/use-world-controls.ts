import { useEffect, useRef } from "react";
import { directionTarget, keyDirection, nearestUsable } from "./controls.js";
import type { SceneLayout } from "./layout-types.js";
import type { WorldSceneProps } from "./types.js";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useWorldControls(props: WorldSceneProps, layout: SceneLayout): void {
  const latest = useRef({ props, layout });

  useEffect(() => {
    latest.current = { props, layout };
  }, [props, layout]);

  useEffect(() => {
    if (!props.interactive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const { world, state, onMoveTo, onInteract } = latest.current.props;
      const direction = keyDirection(event.code);
      if (direction !== null) {
        event.preventDefault();
        const roomId = directionTarget(world, state.currentRoomId, direction);
        if (roomId !== null) onMoveTo(roomId);
        return;
      }
      if (event.code !== "KeyE") return;
      const entityId = nearestUsable(world, latest.current.layout, state);
      if (entityId !== null) onInteract(entityId);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [props.interactive]);
}
