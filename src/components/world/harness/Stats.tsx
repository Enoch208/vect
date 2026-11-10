import { useEffect, useRef, type ReactElement } from "react";
import { palette } from "../palette.js";

export function Stats(): ReactElement {
  const label = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const scene = document.querySelector<HTMLElement>("[data-world-scene]");
      if (label.current === null || scene === null) return;
      const data = scene.dataset;
      label.current.textContent = `${data["fps"] ?? "—"} FPS · ${data["calls"] ?? "—"} CALLS · QUALITY ${data["quality"] ?? "—"}`;
    }, 250);
    return () => {
      window.clearInterval(timer);
    };
  }, []);
  return (
    <pre
      ref={label}
      style={{
        position: "fixed",
        right: 16,
        bottom: 12,
        margin: 0,
        font: "11px ui-monospace, monospace",
        color: palette.muted,
        pointerEvents: "none",
      }}
    />
  );
}
