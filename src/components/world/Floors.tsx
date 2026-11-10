import type { ThreeEvent } from "@react-three/fiber";
import { useState, type ReactElement } from "react";
import { dims } from "./blocks.js";
import type { RoomLayout } from "./layout-types.js";
import { useScene } from "./scene-context.js";

const clickSlop = 6;

export function setCursor(event: ThreeEvent<PointerEvent>, cursor: string): void {
  const target = event.nativeEvent.target;
  if (target instanceof HTMLElement) target.style.cursor = cursor;
}

type FloorProps = {
  room: RoomLayout;
  current: boolean;
  onMoveTo: (roomId: string) => void;
};

function Floor({ room, current, onMoveTo }: FloorProps): ReactElement {
  const { kit, interactive } = useScene();
  const [hovered, setHovered] = useState(false);
  const side = room.size - dims.floorInset * 2;
  const lit = interactive && hovered && !current;
  return (
    <mesh
      position={[room.center[0], 0.02, room.center[1]]}
      receiveShadow
      onClick={(event) => {
        if (!interactive || event.delta > clickSlop) return;
        event.stopPropagation();
        onMoveTo(room.id);
      }}
      onPointerOver={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        setHovered(true);
        setCursor(event, current ? "default" : "pointer");
      }}
      onPointerOut={(event) => {
        setHovered(false);
        setCursor(event, "default");
      }}
    >
      <boxGeometry args={[side, 0.04, side]} />
      <meshStandardMaterial
        color={lit ? kit.trim.color : kit.floor.color}
        roughness={kit.floor.roughness}
        metalness={kit.floor.metalness}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  );
}

type FloorsProps = { currentRoomId: string; onMoveTo: (roomId: string) => void };

export function Floors({ currentRoomId, onMoveTo }: FloorsProps): ReactElement {
  const { layout } = useScene();
  return (
    <group>
      {layout.rooms.map((room) => (
        <Floor key={room.id} room={room} current={room.id === currentRoomId} onMoveTo={onMoveTo} />
      ))}
    </group>
  );
}
