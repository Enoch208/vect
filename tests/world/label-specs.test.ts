import { describe, expect, it } from "vitest";
import { projectToView } from "../../src/components/world/camera-math.js";
import {
  clampLines,
  labelSize,
  placeLabels,
  type LabelSpec,
} from "../../src/components/world/label-layout.js";
import {
  roomFootprints,
  sceneNotes,
  type NoteInput,
} from "../../src/components/world/label-specs.js";
import { layoutWorld } from "../../src/components/world/layout.js";
import { pairTags } from "../../src/components/world/pairing.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { createInitialState } from "../../src/domain/step-game.js";
import { derive, editEntity } from "../../src/fixtures/build.js";
import { observatory } from "../../src/fixtures/observatory.js";
import { tenRoomTemple } from "../../src/fixtures/suite-large.js";

function input(world: WorldSpec, extra: Partial<NoteInput> = {}): NoteInput {
  return {
    world,
    state: createInitialState(world, world.seed),
    layout: layoutWorld(world),
    pairing: pairTags(world),
    highlightIds: [],
    selectedEntityId: null,
    compact: false,
    zoom: 22,
    actor: null,
    ...extra,
  };
}

const lockedDoor = derive(observatory, {
  entities: editEntity(observatory, "door1", { label: "Locked Lens Workshop Door" }),
});

describe("gate labels", () => {
  it("does not repeat a state word the label already says", () => {
    const gate = sceneNotes(input(lockedDoor)).find((note) => note.id === "gate:c2");
    expect(gate?.lines.join(" ")).toBe("Locked Lens Workshop Door");
    const plain = sceneNotes(input(observatory)).find((note) => note.id === "gate:c2");
    expect(plain?.lines.at(-1)).toBe("LOCKED");
  });

  it("shrinks to its marker and state when the view is small, unless it is highlighted", () => {
    const small = sceneNotes(input(lockedDoor, { compact: true, zoom: 11 }));
    const gate = small.find((note) => note.id === "gate:c2");
    expect(gate?.lines).toEqual(["LOCKED"]);
    expect(gate?.badge).toBe("K1");
    const flagged = sceneNotes(
      input(lockedDoor, { compact: true, zoom: 11, highlightIds: ["door1"] }),
    );
    expect(flagged.find((note) => note.id === "gate:c2")?.lines.join(" ")).toContain("Workshop");
  });
});

describe("entity labels", () => {
  it("keeps a long name to two short rows when the view is small", () => {
    const wordy = derive(observatory, {
      entities: editEntity(observatory, "telescope", {
        kind: "chest",
        label: "Workshop Access Key Left By The Last Night Keeper",
      }),
    });
    const brief = sceneNotes(input(wordy, { compact: true, zoom: 11 })).find(
      (note) => note.id === "entity:telescope",
    );
    expect(brief?.lines.length).toBe(2);
    expect(brief?.lines.every((line) => line.length <= 16)).toBe(true);
    const full = sceneNotes(input(wordy)).find((note) => note.id === "entity:telescope");
    expect(full?.lines.join(" ")).toBe("Workshop Access Key Left By The Last Night Keeper");
  });
});

describe("room captions", () => {
  it("wraps tighter as the view shrinks and never runs past three rows", () => {
    const long = derive(observatory, {
      rooms: observatory.rooms.map((room, index) =>
        index === 0
          ? { ...room, label: "The Extraordinarily Long Mountain Entrance Hall Of Stars" }
          : room,
      ),
    });
    const wide = sceneNotes(input(long, { zoom: 26 })).find((note) => note.id === "room:entrance");
    const narrow = sceneNotes(input(long, { zoom: 10 })).find(
      (note) => note.id === "room:entrance",
    );
    const widest = (lines: readonly string[]) => Math.max(...lines.map((line) => line.length));
    expect(widest(narrow?.lines ?? [])).toBeLessThan(widest(wide?.lines ?? []));
    expect(narrow?.lines.length).toBeLessThanOrEqual(3);
    expect(narrow?.lines.at(-1)?.endsWith("..")).toBe(true);
    expect(clampLines(["a", "b"], 3)).toEqual(["a", "b"]);
  });

  it("yields to the actor, to gates and to entity labels", () => {
    const notes = sceneNotes(
      input(observatory, { actor: { anchor: [0, 2.3, 0], text: "TEST AGENT" } }),
    );
    const priority = (id: string) => notes.find((note) => note.id === id)?.priority ?? -1;
    expect(priority("actor")).toBeGreaterThan(priority("gate:c2"));
    expect(priority("gate:c2")).toBeGreaterThan(priority("room:entrance"));
    expect(priority("entity:key1")).toBeLessThan(priority("gate:c2"));
  });

  it("moves off a neighbouring room onto free paper when it can", () => {
    const layout = layoutWorld(tenRoomTemple);
    const rooms = roomFootprints(layout);
    const zoom = 14;
    const placed = placeLabels(
      sceneNotes(input(tenRoomTemple, { compact: true, zoom })),
      zoom,
      rooms,
    );
    const captions = placed.filter((note) => note.id.startsWith("room:"));
    const onRoom = captions.filter((note) => {
      const [u, v] = projectToView(...note.anchor);
      const size = labelSize(note.lines, note.badge);
      const x = u * zoom + note.shift;
      const y = v * zoom - note.lift - size.height / 2;
      return rooms.some(
        (room) =>
          Math.abs(x - room.u * zoom) / (room.halfWidth * zoom) +
            Math.abs(y - room.v * zoom) / (room.halfHeight * zoom) <=
          1,
      );
    });
    expect(captions).toHaveLength(10);
    expect(onRoom.length).toBeLessThanOrEqual(2);
  });
});

describe("placeLabels with alternates", () => {
  it("uses an alternate anchor when the first is taken", () => {
    const blocker: LabelSpec = {
      id: "a",
      anchor: [0, 0, 0],
      lines: ["XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "X", "X", "X", "X", "X", "X", "X"],
      badge: null,
      below: false,
      priority: 9,
    };
    const mover: LabelSpec = {
      id: "b",
      anchor: [0, 0, 0],
      alternates: [[30, 0, -30]],
      lines: ["MOVER"],
      badge: null,
      below: false,
      priority: 1,
    };
    const placed = placeLabels([blocker, mover], 20).find((note) => note.id === "b");
    expect(placed?.anchor).toEqual([30, 0, -30]);
    expect(placed?.lift).toBe(0);
  });
});
