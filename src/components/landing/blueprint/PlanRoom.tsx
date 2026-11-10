import type { RoomLayout } from "../../world/layout.js";
import type { Rect } from "./plan-geometry.js";

type PlanRoomProps = { room: RoomLayout; walls: readonly Rect[]; tint: boolean };

export function PlanRoom({ room, walls, tint }: PlanRoomProps) {
  const half = room.size / 2;
  const [cx, cz] = room.center;
  return (
    <g data-room={room.id}>
      {tint && (
        <rect
          x={cx - half}
          y={cz - half}
          width={room.size}
          height={room.size}
          className="fill-accent-soft/45"
        />
      )}
      <g data-layer="structure" className="fill-ink/85">
        {walls.map((wall) => (
          <rect
            key={`${String(wall.x)}:${String(wall.z)}`}
            x={wall.x}
            y={wall.z}
            width={wall.w}
            height={wall.h}
          />
        ))}
      </g>
      <text
        data-layer="detail"
        x={cx - half + 0.75}
        y={cz - half + 1.3}
        className="fill-ink font-mono text-[0.62px] font-medium tracking-[0.04em] uppercase"
      >
        {room.label}
      </text>
    </g>
  );
}
