import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { settle, snapSpring, stepSpring, type Spring, type SpringConfig } from "./spring.js";

const fade: SpringConfig = { stiffness: 46, damping: 9 };

export function useSpring(
  target: number,
  reducedMotion: boolean,
  apply: (value: number, velocity: number) => void,
  config: SpringConfig = settle,
): void {
  const spring = useRef<Spring | null>(null);
  const active = useRef(true);
  const invalidate = useThree((three) => three.invalidate);

  useEffect(() => {
    active.current = true;
    invalidate();
  }, [target, reducedMotion, invalidate]);

  useFrame((three, delta) => {
    if (!active.current) return;
    const current = spring.current ?? { value: target, velocity: 0 };
    spring.current = current;
    if (reducedMotion) snapSpring(current, target);
    const resting = reducedMotion || stepSpring(current, target, delta, config);
    apply(current.value, current.velocity);
    if (resting) active.current = false;
    else three.invalidate();
  });
}

export function usePulse(
  on: boolean,
  reducedMotion: boolean,
  apply: (energy: number) => void,
): void {
  const energy = useRef<Spring>({ value: 0, velocity: 0 });
  const active = useRef(true);
  const invalidate = useThree((three) => three.invalidate);

  useEffect(() => {
    energy.current.value = on && !reducedMotion ? 1 : 0;
    energy.current.velocity = 0;
    active.current = true;
    invalidate();
  }, [on, reducedMotion, invalidate]);

  useFrame((three, delta) => {
    if (!active.current) return;
    const resting = stepSpring(energy.current, 0, delta, fade);
    apply(energy.current.value);
    if (resting) active.current = false;
    else three.invalidate();
  });
}
