import { describe, expect, it } from "vitest";
import { layoutWorld, type Point } from "../../src/components/world/layout.js";
import { arrivalRadius, padRadius } from "../../src/components/world/layout-rooms.js";
import { walkRoute } from "../../src/components/world/walk.js";
import { connection, derive } from "../../src/fixtures/build.js";
import { observatory } from "../../src/fixtures/observatory.js";

const portalWorld = derive(observatory, {
  connections: [...observatory.connections, connection("jump", "entrance", "control")],
});

function distanceToLeg(point: Point, from: Point, to: Point): number {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const lengthSquared = dx * dx + dz * dz;
  const progress =
    lengthSquared === 0
      ? 0
      : Math.min(
          1,
          Math.max(0, ((point[0] - from[0]) * dx + (point[1] - from[1]) * dz) / lengthSquared),
        );
  return Math.hypot(point[0] - from[0] - progress * dx, point[1] - from[1] - progress * dz);
}

describe("portal placement", () => {
  it("keeps a doorless portal's gate anchor on one of its own pads", () => {
    const portal = layoutWorld(portalWorld).corridors.find(
      (corridor) => corridor.connectionId === "jump",
    );
    if (portal === undefined) throw new Error("portal is missing");
    expect([portal.from, portal.to]).toContainEqual(portal.gate);
  });

  it("keeps both pads clear of the actor's corridor routes in either grid orientation", () => {
    const parallel = derive(portalWorld, {
      connections: [...portalWorld.connections, connection("second", "entrance", "library")],
    });
    for (const world of [portalWorld, parallel]) {
      for (const rotated of [false, true]) {
        const layout = layoutWorld(
          derive(world, {
            rooms: world.rooms.map((room) => ({
              ...room,
              grid: rotated ? { x: room.grid.z, z: room.grid.x } : room.grid,
            })),
          }),
        );
        const portal = layout.corridors.find((corridor) => corridor.connectionId === "jump");
        if (portal === undefined) throw new Error("portal is missing");
        for (const [roomId, pad] of [
          [portal.fromRoomId, portal.from],
          [portal.toRoomId, portal.to],
        ] as const) {
          const room = layout.rooms.find((candidate) => candidate.id === roomId);
          if (room === undefined) throw new Error("portal room is missing");
          for (const opening of room.openings) {
            const corridor = layout.corridors.find(
              (candidate) => candidate.connectionId === opening.connectionId,
            );
            const nextId =
              corridor?.fromRoomId === roomId ? corridor.toRoomId : corridor?.fromRoomId;
            const next = layout.rooms.find((candidate) => candidate.id === nextId);
            if (next === undefined) throw new Error("corridor room is missing");
            const route = walkRoute(
              layout,
              room.center,
              room.id,
              next.center,
              next.id,
              new Set([opening.connectionId]),
            );
            if (route === null) throw new Error("corridor route is missing");
            for (const leg of route.legs) {
              expect(
                distanceToLeg(pad, leg.from, leg.to),
                `${roomId}: ${opening.connectionId}`,
              ).toBeGreaterThanOrEqual(padRadius + arrivalRadius);
            }
          }
        }
      }
    }
  });
});
