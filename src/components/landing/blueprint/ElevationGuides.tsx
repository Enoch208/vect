import type { SectionDrawing } from "./section-geometry.js";

export function ElevationGuides({ drawing }: { drawing: SectionDrawing }) {
  const floor = drawing.rooms[0]?.floor ?? 520;
  const end = drawing.y + drawing.height - 4;
  return (
    <g data-elevation-guides="" opacity="0" strokeWidth="0.6" fill="none">
      <g stroke="#8e948a" strokeDasharray="15 5 2 5">
        {drawing.rooms.map((room) => (
          <g key={room.id}>
            <path
              d={`M${String(room.left)} ${String(room.top - 45)}V${String(end)}M${String(room.right)} ${String(room.top - 45)}V${String(end)}`}
            />
            <path d={`M70 ${String(room.top)}H${String(drawing.width - 70)}`} />
          </g>
        ))}
        <path d={`M70 ${String(floor)}H${String(drawing.width - 70)}`} />
      </g>
      <g stroke="#fa3600">
        <path
          d={`M70 ${String(drawing.y + 40)}V${String(floor)}M${String(drawing.rooms[0]?.left ?? 0)} ${String(end)}H${String(drawing.rooms.at(-1)?.right ?? 0)}`}
        />
      </g>
    </g>
  );
}
