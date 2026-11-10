import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { OrthographicCamera } from "three";
import {
  cameraDistance,
  clampToBounds,
  fitMargin,
  fitView,
  groundPoint,
  viewDirection,
} from "./camera-math.js";
import type { Point } from "./layout-types.js";
import { useScene } from "./scene-context.js";
import { glide, snapSpring, stepSpring, type Spring } from "./spring.js";

const followZoom = 21;
const maxZoom = 54;
const overviewMs = 1400;
const zoomStep = 0.0016;

type Rig = { x: Spring; z: Spring; zoom: Spring };

export function CameraRig({ focus }: { focus: Point }): null {
  const { layout, reducedMotion } = useScene();
  const size = useThree((three) => three.size);
  const invalidate = useThree((three) => three.invalidate);
  const canvas = useThree((three) => three.gl.domElement);
  const fit = useMemo(() => fitView(layout.bounds, size, fitMargin), [layout.bounds, size]);
  const rig = useRef<Rig | null>(null);
  const user = useRef({ zoom: 1, pan: [0, 0] as Point, following: false });
  const active = useRef(true);
  const started = useRef(false);

  useEffect(() => {
    user.current.pan = [0, 0];
    active.current = true;
    invalidate();
  }, [focus, fit, invalidate]);

  useEffect(() => {
    user.current.following = reducedMotion;
    const timer = window.setTimeout(() => {
      user.current.following = true;
      active.current = true;
      invalidate();
    }, overviewMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [layout, reducedMotion, invalidate]);

  useEffect(() => {
    const wake = () => {
      active.current = true;
      invalidate();
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = user.current.zoom * Math.exp(-event.deltaY * zoomStep);
      user.current.zoom = Math.min(maxZoom / fit.zoom, Math.max(0.85, next));
      wake();
    };
    const onMove = (event: PointerEvent) => {
      if (event.buttons === 0 || rig.current === null) return;
      const zoom = rig.current.zoom.value;
      const [dx, dz] = groundPoint(-event.movementX / zoom, event.movementY / zoom);
      user.current.pan = [user.current.pan[0] + dx, user.current.pan[1] + dz];
      wake();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointermove", onMove);
    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointermove", onMove);
    };
  }, [canvas, fit.zoom, invalidate]);

  useFrame((three, delta) => {
    if (!active.current) return;
    const close = fit.zoom < followZoom && user.current.following;
    const base = close ? focus : fit.center;
    const zoomTarget = (close ? followZoom : fit.zoom) * user.current.zoom;
    const [tx, tz] = clampToBounds(
      [base[0] + user.current.pan[0], base[1] + user.current.pan[1]],
      layout.bounds,
    );
    const state = rig.current ?? {
      x: { value: tx, velocity: 0 },
      z: { value: tz, velocity: 0 },
      zoom: { value: zoomTarget, velocity: 0 },
    };
    rig.current = state;
    const snap = reducedMotion || !started.current;
    if (snap) {
      snapSpring(state.x, tx);
      snapSpring(state.z, tz);
      snapSpring(state.zoom, zoomTarget);
    }
    started.current = true;
    const settledX = stepSpring(state.x, tx, delta, glide);
    const settledZ = stepSpring(state.z, tz, delta, glide);
    const settledZoom = stepSpring(state.zoom, zoomTarget, delta, glide);
    const camera = three.camera;
    camera.position.set(
      state.x.value + viewDirection[0] * cameraDistance,
      viewDirection[1] * cameraDistance,
      state.z.value + viewDirection[2] * cameraDistance,
    );
    camera.lookAt(state.x.value, 0, state.z.value);
    if (camera instanceof OrthographicCamera) {
      camera.zoom = state.zoom.value;
      camera.updateProjectionMatrix();
    }
    if (settledX && settledZ && settledZoom) active.current = false;
    else three.invalidate();
  });

  return null;
}
