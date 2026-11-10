import { useState, useSyncExternalStore } from "react";
import { z } from "zod";

const key = "vect-reduced-motion";
const query = "(prefers-reduced-motion: reduce)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => {
    media.removeEventListener("change", listener);
  };
}
function systemPreference() {
  return window.matchMedia(query).matches;
}
function savedPreference(): { value: boolean | null; notice: string | null } {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { value: null, notice: null };
    const parsed = z.boolean().safeParse(JSON.parse(raw));
    return parsed.success
      ? { value: parsed.data, notice: null }
      : {
          value: null,
          notice: "The motion preference was invalid; the system preference is being used.",
        };
  } catch {
    return {
      value: null,
      notice: "The motion preference could not be restored; the system preference is being used.",
    };
  }
}

export function useMotionPreference() {
  const system = useSyncExternalStore(subscribe, systemPreference, () => false);
  const [preference, setPreference] = useState(savedPreference);
  const reducedMotion = preference.value ?? system;
  function toggle() {
    const value = !reducedMotion;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setPreference({ value, notice: null });
    } catch {
      setPreference({
        value,
        notice: "The motion preference applies to this session but could not be saved.",
      });
    }
  }
  return { reducedMotion, notice: preference.notice, toggle };
}
