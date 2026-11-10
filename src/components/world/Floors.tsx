import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { BoxGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { dims } from "./blocks.js";
import type { RoomLayout, SceneLayout } from "./layout-types.js";
import { useScene } from "./scene-context.js";

const clickSlop = 6;
const slabHeight = 0.04;

export function setCursor(event: ThreeEvent<PointerEvent>, cursor: string): void {
  const target = event.nativeEvent.target;
  if (target instanceof HTMLElement) target.style.cursor = cursor;
}

function inlaySide(room: RoomLayout): number {
  return room.size - dims.floorInset * 2;
}

function roomUnder(layout: SceneLayout, x: number, z: number): RoomLayout | null {
  return (
    layout.rooms.find((room) => {
      const half = inlaySide(room) / 2 + 0.01;
      return Math.abs(x - room.center[0]) <= half && Math.abs(z - room.center[1]) <= half;
    }) ?? null
  );
}

type FloorsProps = { currentRoomId: string; onMoveTo: (roomId: string) => void };

export function Floors({ currentRoomId, onMoveTo }: FloorsProps): ReactElement {
  const { layout, kit, interactive } = useScene();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const geometry = useMemo(() => {
    const slabs = layout.rooms.map((room) =>
      new BoxGeometry(inlaySide(room), slabHeight, inlaySide(room)).translate(
        room.center[0],
        slabHeight / 2,
        room.center[1],
      ),
    );
    const merged = mergeGeometries(slabs);
    for (const slab of slabs) slab.dispose();
    return merged;
  }, [layout]);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  const hovered = layout.rooms.find((room) => room.id === hoveredId && room.id !== currentRoomId);
  return (
    <group>
      <mesh
        geometry={geometry}
        receiveShadow
        onClick={(event) => {
          const room = roomUnder(layout, event.point.x, event.point.z);
          if (!interactive || event.delta > clickSlop || room === null) return;
          event.stopPropagation();
          onMoveTo(room.id);
        }}
        onPointerMove={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          const room = roomUnder(layout, event.point.x, event.point.z);
          setHoveredId(room?.id ?? null);
          setCursor(event, room !== null && room.id !== currentRoomId ? "pointer" : "default");
        }}
        onPointerOut={(event) => {
          setHoveredId(null);
          setCursor(event, "default");
        }}
      >
        <meshStandardMaterial
          color={kit.floor.color}
          roughness={kit.floor.roughness}
          metalness={kit.floor.metalness}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {interactive && hovered !== undefined ? (
        <mesh position={[hovered.center[0], slabHeight + 0.004, hovered.center[1]]}>
          <boxGeometry args={[inlaySide(hovered), 0.004, inlaySide(hovered)]} />
          <meshBasicMaterial color={kit.ink} transparent opacity={0.06} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}
