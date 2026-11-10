import type { WorldSpec } from "../contract/world.schema.js";
import { connection, entity, flag, hasItem, room, sampleWorld } from "./build.js";

export const goalSeenTooEarly: WorldSpec = sampleWorld({
  id: "goal-seen-too-early",
  title: "Light Before Entry",
  theme: "temple",
  prompt: "The shrine is open from the start, but only counts once the lamp is lit.",
  rooms: [
    room("porch", "Porch", 0, 0),
    room("shrine", "Shrine", 1, 0),
    room("shed", "Lamp Shed", 0, 1),
    room("yard", "Yard", -1, 0),
  ],
  connections: [
    connection("c1", "porch", "shrine"),
    connection("c2", "porch", "shed"),
    connection("c3", "porch", "yard"),
  ],
  entities: [
    entity({ id: "lamp", kind: "switch", label: "Lamp", roomId: "shed", setsFlag: "lamp-lit" }),
    entity({ id: "offering", kind: "goal", label: "Make the Offering", roomId: "shrine" }),
  ],
  startRoomId: "porch",
  goal: { id: "offering", roomId: "shrine", requires: flag("lamp-lit") },
});

export const backtrackingWorld: WorldSpec = sampleWorld({
  id: "backtracking-wings",
  title: "The Far Key",
  theme: "castle",
  prompt: "A castle whose east door key lies at the end of the west wing.",
  rooms: [
    room("hub", "Hub", 0, 0),
    room("w1", "West Gallery", -1, 0),
    room("w2", "West Study", -2, 0),
    room("w3", "West Archive", -3, 0),
    room("n1", "North Stair", 0, 1),
    room("n2", "Beacon Loft", 0, 2),
    room("e1", "East Hall", 1, 0),
    room("e2", "East Keep", 2, 0),
  ],
  connections: [
    connection("c1", "hub", "w1"),
    connection("c2", "w1", "w2"),
    connection("c3", "w2", "w3"),
    connection("c4", "hub", "n1"),
    connection("c5", "n1", "n2"),
    connection("c6", "hub", "e1", hasItem("east-key"), "east-door"),
    connection("c7", "e1", "e2", flag("beacon-lit"), "keep-gate"),
  ],
  entities: [
    entity({
      id: "east-key",
      kind: "key",
      label: "East Key",
      roomId: "w3",
      grantsItemId: "east-key",
    }),
    entity({
      id: "beacon",
      kind: "switch",
      label: "Beacon",
      roomId: "n2",
      setsFlag: "beacon-lit",
    }),
    entity({ id: "east-door", kind: "door", label: "East Door", roomId: "e1" }),
    entity({ id: "keep-gate", kind: "portal", label: "Keep Gate", roomId: "e2" }),
    entity({ id: "banner", kind: "goal", label: "Raise the Banner", roomId: "e2" }),
  ],
  startRoomId: "hub",
  goal: { id: "banner", roomId: "e2", requires: flag("beacon-lit") },
});
