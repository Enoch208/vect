import { describe, expect, it } from "vitest";
import {
  cellSize,
  gridToScene,
  layoutWorld,
  roomSize,
  type RoomLayout,
  type SceneLayout,
} from "../../src/components/world/layout.js";
import { createInitialState, stepGame } from "../../src/domain/step-game.js";
import { connection, derive, entity } from "../../src/fixtures/build.js";
import { observatory } from "../../src/fixtures/observatory.js";
import { tenRoomTemple } from "../../src/fixtures/suite-large.js";

function roomOf(layout: SceneLayout, id: string): RoomLayout {
  const room = layout.rooms.find((item) => item.id === id);
  if (room === undefined) throw new Error(`no room ${id}`);
  return room;
}

function gateIds(layout: SceneLayout): Set<string> {
  return new Set(layout.corridors.flatMap((item) => item.gateEntityId ?? []));
}

const crowded = derive(observatory, {
  entities: [
    ...observatory.entities,
    entity({ id: "globe", kind: "prop", label: "Globe", roomId: "library" }),
    entity({ id: "desk", kind: "prop", label: "Desk", roomId: "library" }),
    entity({ id: "lever", kind: "switch", label: "Lever", roomId: "library", setsFlag: "lit" }),
    entity({ id: "crate", kind: "chest", label: "Crate", roomId: "library" }),
    entity({ id: "rest", kind: "checkpoint", label: "Rest", roomId: "library" }),
    entity({
      id: "plate",
      kind: "trap",
      label: "Plate",
      roomId: "library",
      localPosition: { x: 0.4, y: 0, z: -0.3 },
    }),
  ],
});

const withPortal = derive(observatory, {
  connections: [...observatory.connections, connection("c4", "entrance", "control")],
});

describe("layoutWorld", () => {
  it("observatory rooms do not overlap and corridors join facing openings", () => {
    const layout = layoutWorld(observatory);
    expect(layout.rooms.map((room) => room.size)).toEqual([
      roomSize.medium,
      roomSize.small,
      roomSize.medium,
      roomSize.large,
    ]);
    layout.rooms.forEach((a, index) => {
      for (const b of layout.rooms.slice(index + 1)) {
        const gapX = Math.abs(a.center[0] - b.center[0]) - (a.size + b.size) / 2;
        const gapZ = Math.abs(a.center[1] - b.center[1]) - (a.size + b.size) / 2;
        expect(Math.max(gapX, gapZ)).toBeGreaterThan(0);
      }
    });
    const c2 = layout.corridors.find((item) => item.connectionId === "c2");
    expect(c2).toMatchObject({ kind: "corridor", gateEntityId: "door1", gated: true, axis: "x" });
    const library = roomOf(layout, "library");
    const control = roomOf(layout, "control");
    expect(library.openings).toContainEqual(
      expect.objectContaining({ side: "e", connectionId: "c2" }),
    );
    expect(control.openings).toContainEqual(
      expect.objectContaining({ side: "w", connectionId: "c2" }),
    );
    expect(c2?.from).toEqual([library.center[0] + library.size / 2, library.center[1]]);
    expect(c2?.to).toEqual([control.center[0] - control.size / 2, control.center[1]]);
    expect(c2?.gate).toEqual(c2?.to);
    expect(layout.corridors.find((item) => item.connectionId === "c1")?.gated).toBe(false);
  });

  it("a non-adjacent connection is a portal", () => {
    const layout = layoutWorld(withPortal);
    const c4 = layout.corridors.find((item) => item.connectionId === "c4");
    expect(c4?.kind).toBe("portal");
    const entrance = roomOf(layout, "entrance");
    const control = roomOf(layout, "control");
    expect(entrance.openings.map((item) => item.connectionId)).not.toContain("c4");
    expect(Math.abs((c4?.from[0] ?? 99) - entrance.center[0])).toBeLessThan(entrance.size / 2);
    expect(Math.abs((c4?.to[0] ?? 99) - control.center[0])).toBeLessThan(control.size / 2);
  });

  it("entity positions stay inside their room", () => {
    for (const world of [observatory, crowded, tenRoomTemple]) {
      const layout = layoutWorld(world);
      const gates = gateIds(layout);
      for (const item of layout.entities.filter((placed) => !gates.has(placed.id))) {
        const room = roomOf(layout, item.roomId);
        const reach = room.size / 2 - item.footprint;
        expect(Math.abs(item.position[0] - room.center[0])).toBeLessThanOrEqual(reach);
        expect(Math.abs(item.position[2] - room.center[1])).toBeLessThanOrEqual(reach);
      }
    }
  });

  it("entity footprints in a crowded room do not intersect", () => {
    for (const world of [crowded, tenRoomTemple]) {
      const layout = layoutWorld(world);
      const gates = gateIds(layout);
      const placed = layout.entities.filter((item) => !gates.has(item.id));
      placed.forEach((a, index) => {
        for (const b of placed.slice(index + 1)) {
          if (a.roomId !== b.roomId) continue;
          const distance = Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
          expect(distance, `${a.id} and ${b.id}`).toBeGreaterThanOrEqual(
            a.footprint + b.footprint - 1e-9,
          );
        }
      });
    }
  });

  it("an uncontested entity keeps its authored position", () => {
    const layout = layoutWorld(observatory);
    const key = layout.entities.find((item) => item.id === "key1");
    const library = roomOf(layout, "library");
    expect(key?.position[0]).toBeCloseTo(library.center[0] + 0.4 * (library.size / 2) * 0.8);
    expect(key?.position[2]).toBeCloseTo(library.center[1] - 0.3 * (library.size / 2) * 0.8);
  });

  it("gridToScene(state.position) after entering the library equals the library centre", () => {
    const start = createInitialState(observatory, observatory.seed);
    const moved = stepGame(observatory, start, { type: "MOVE_TO", roomId: "library" });
    expect(moved.ok).toBe(true);
    expect(gridToScene(moved.state.position)).toEqual(
      roomOf(layoutWorld(observatory), "library").center,
    );
    expect(gridToScene({ x: 1, z: -2 })).toEqual([cellSize, -2 * cellSize]);
  });

  it("a gated connection without a door is still flagged gated", () => {
    const c6 = layoutWorld(tenRoomTemple).corridors.find((item) => item.connectionId === "c6");
    expect(c6).toMatchObject({ gated: true, gateEntityId: null });
  });

  it("a blocker stands in the opening of the connection it blocks", () => {
    const layout = layoutWorld(tenRoomTemple);
    const rubble = layout.entities.find((item) => item.id === "rubble");
    const vault = roomOf(layout, "vault");
    const opening = vault.openings.find((item) => item.connectionId === "c10");
    expect(opening?.side).toBe("w");
    expect(layout.corridors.find((item) => item.connectionId === "c10")?.gated).toBe(true);
    expect(rubble?.position[2]).toBeCloseTo(opening?.point[1] ?? 99);
    expect(Math.abs((rubble?.position[0] ?? 99) - (opening?.point[0] ?? 0))).toBeLessThan(1.5);
  });

  it("two connections between the same rooms get separate openings", () => {
    const doubled = derive(observatory, {
      connections: [...observatory.connections, connection("c5", "entrance", "library")],
    });
    const openings = roomOf(layoutWorld(doubled), "entrance").openings;
    expect(openings).toHaveLength(2);
    expect(openings[0]?.point).not.toEqual(openings[1]?.point);
  });

  it("is deterministic and covers every room in its bounds", () => {
    const layout = layoutWorld(tenRoomTemple);
    expect(layoutWorld(tenRoomTemple)).toEqual(layout);
    for (const room of layout.rooms) {
      expect(layout.bounds.minX).toBeLessThanOrEqual(room.center[0] - room.size / 2);
      expect(layout.bounds.maxX).toBeGreaterThanOrEqual(room.center[0] + room.size / 2);
      expect(layout.bounds.minZ).toBeLessThanOrEqual(room.center[1] - room.size / 2);
      expect(layout.bounds.maxZ).toBeGreaterThanOrEqual(room.center[1] + room.size / 2);
    }
  });
});
