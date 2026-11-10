import { useMemo } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { Elevation, type ViewBox } from "../blueprint/Elevation.js";
import { sectionDrawing } from "../blueprint/section-geometry.js";
import { Button } from "../primitives/Buttons.js";
import { display } from "../primitives/type.js";
import { BuiltWith } from "./BuiltWith.js";

type StatementProps = { world: WorldSpec; onOpenExample: () => void };

function focusOnTallestRoom(world: WorldSpec): {
  view: ViewBox;
  disc: { cx: number; cy: number; r: number };
} {
  const drawing = sectionDrawing(world);
  const tallest = drawing.rooms.reduce(
    (best, room) => (room.top < best.top ? room : best),
    drawing.rooms[0] ?? { id: "", left: 0, right: drawing.width, top: 0, floor: drawing.height },
  );
  const width = tallest.right - tallest.left;
  const view = {
    x: tallest.left - width * 0.55,
    y: tallest.top - width * 0.95,
    width: width * 2.1,
    height: tallest.floor - tallest.top + width * 0.95 + 40,
  };
  return {
    view,
    disc: { cx: tallest.left + width * 0.18, cy: tallest.top - width * 0.76, r: width * 0.34 },
  };
}

export function Statement({ world, onOpenExample }: StatementProps) {
  const { view, disc } = useMemo(() => focusOnTallestRoom(world), [world]);
  return (
    <section aria-labelledby="statement-title" className="grid border-b border-rule lg:grid-cols-2">
      <div className="relative flex items-end justify-center overflow-hidden border-rule max-lg:border-b lg:min-h-[calc(var(--spacing)*76.8)] lg:border-r">
        <Elevation
          world={world}
          view={view}
          showLabels={false}
          className="max-h-full"
          underlay={<circle cx={disc.cx} cy={disc.cy} r={disc.r} className="fill-accent" />}
        />
      </div>
      <div className="flex flex-col">
        <div className="flex flex-col gap-[calc(var(--spacing)*3.2)] p-[12px] pt-[calc(var(--spacing)*4)] lg:p-3 lg:pt-[calc(var(--spacing)*6)] lg:pl-[calc(var(--spacing)*15.2)]">
          <h2 id="statement-title" data-reveal="" className={`${display.m} max-w-[18ch]`}>
            The part AI skips is the game. A scene that renders is not a level that works.
          </h2>
          <div>
            <Button variant="outline" onClick={onOpenExample}>
              Open example world
            </Button>
          </div>
        </div>
        <div className="flex-1" />
        <BuiltWith />
      </div>
    </section>
  );
}
