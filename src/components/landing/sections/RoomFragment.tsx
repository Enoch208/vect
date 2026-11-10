import { useMemo } from "react";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { Plan } from "../blueprint/Plan.js";
import { planGeometry, pointOf, roomView } from "../blueprint/plan-geometry.js";
import { BracketLabel } from "../primitives/Label.js";
import { body, mono } from "../primitives/type.js";
import type { RoomEvent } from "./room-events.js";

type RoomFragmentProps = { world: WorldSpec; event: RoomEvent };

export function RoomFragment({ world, event }: RoomFragmentProps) {
  const geometry = useMemo(() => planGeometry(world), [world]);
  const target =
    [...event.targetIds].reverse().find((id) => world.entities.some((item) => item.id === id)) ??
    event.roomId;
  const at = pointOf(geometry.layout, target);
  const view = roomView(geometry.layout, event.roomId, 1.6, at) ?? geometry.view;
  const room = world.rooms.find((item) => item.id === event.roomId);
  return (
    <figure className="flex flex-col border border-rule bg-paper">
      <figcaption className="flex items-center justify-between gap-2 border-b border-rule px-[calc(var(--spacing)*1.2)] py-[calc(var(--spacing)*0.8)]">
        <BracketLabel>{event.code.replaceAll("_", " ")}</BracketLabel>
        <span className={`${mono.xs} text-ink`}>{room?.label ?? event.roomId}</span>
      </figcaption>
      <Plan
        world={world}
        state={event.state}
        agent={at === null ? null : [at[0] - 1.1, at[1] + 1.1]}
        callouts={[{ targetId: target, code: event.code }]}
        leader={2.6}
        view={view}
        dimensions={false}
        tintRoomId={event.code === "DOOR_LOCKED" ? event.roomId : null}
      />
      <p
        className={`${body.s} border-t border-rule px-[calc(var(--spacing)*1.2)] py-[calc(var(--spacing)*1)] text-ink-72`}
      >
        {event.message}
      </p>
    </figure>
  );
}
