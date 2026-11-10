import type { WorldSpec } from "../contract/world.schema.js";
import { alwaysTrue } from "../contract/expr.schema.js";
import {
  allOf,
  connection,
  derive,
  editConnection,
  editEntity,
  entity,
  flag,
  hasItem,
  room,
  sampleWorld,
} from "./build.js";
import { observatory, observatoryKeyBehindDoor } from "./observatory.js";

export const keyBeforeDoor: WorldSpec = sampleWorld({
  id: "g01-key-before-door",
  title: "Gatehouse Key",
  theme: "castle",
  prompt: "A castle where the throne room key lies in the gatehouse.",
  rooms: [
    room("gatehouse", "Gatehouse", 0, 0),
    room("courtyard", "Courtyard", 1, 0),
    room("armory", "Armory", 1, 1),
    room("throne", "Throne Room", 2, 0),
  ],
  connections: [
    connection("c1", "gatehouse", "courtyard"),
    connection("c2", "courtyard", "armory"),
    connection("c3", "courtyard", "throne", hasItem("iron-key"), "throne-door"),
  ],
  entities: [
    entity({
      id: "iron-key",
      kind: "key",
      label: "Iron Key",
      roomId: "gatehouse",
      grantsItemId: "iron-key",
    }),
    entity({ id: "throne-door", kind: "door", label: "Throne Room Door", roomId: "throne" }),
    entity({ id: "crown", kind: "goal", label: "Claim the Crown", roomId: "throne" }),
  ],
  startRoomId: "gatehouse",
  goal: { id: "crown", roomId: "throne", requires: alwaysTrue },
});

export const switchBehindOpenRoute: WorldSpec = sampleWorld({
  id: "g02-switch-open-route",
  title: "The Lit Altar",
  theme: "temple",
  prompt: "A temple where a brazier in the crypt lights the way to the altar.",
  rooms: [
    room("steps", "Temple Steps", 0, 0),
    room("nave", "Nave", 0, 1),
    room("crypt", "Crypt", 1, 1),
    room("altar", "Altar", 0, 2),
  ],
  connections: [
    connection("c1", "steps", "nave"),
    connection("c2", "nave", "crypt"),
    connection("c3", "nave", "altar", flag("altar-lit"), "altar-veil"),
  ],
  entities: [
    entity({
      id: "brazier",
      kind: "switch",
      label: "Crypt Brazier",
      roomId: "crypt",
      setsFlag: "altar-lit",
    }),
    entity({ id: "altar-veil", kind: "portal", label: "Altar Veil", roomId: "altar" }),
    entity({ id: "relic", kind: "goal", label: "Touch the Relic", roomId: "altar" }),
  ],
  startRoomId: "steps",
  goal: { id: "relic", roomId: "altar", requires: flag("altar-lit") },
});

export const twoSequentialLocks: WorldSpec = sampleWorld({
  id: "g03-two-locks",
  title: "Two Locks",
  theme: "observatory",
  prompt: "An observatory with an archive key for the lab and a lab key for the dome.",
  rooms: [
    room("lobby", "Lobby", 0, 0),
    room("archive", "Archive", 1, 0),
    room("lab", "Lab", 2, 0),
    room("dome", "Dome", 3, 0),
    room("cloakroom", "Cloakroom", 0, 1),
  ],
  connections: [
    connection("c1", "lobby", "archive"),
    connection("c2", "archive", "lab", hasItem("key-a"), "door-a"),
    connection("c3", "lab", "dome", hasItem("key-b"), "door-b"),
    connection("c4", "lobby", "cloakroom"),
  ],
  entities: [
    entity({
      id: "key-a",
      kind: "key",
      label: "Archive Key",
      roomId: "archive",
      grantsItemId: "key-a",
    }),
    entity({ id: "key-b", kind: "key", label: "Lab Key", roomId: "lab", grantsItemId: "key-b" }),
    entity({ id: "door-a", kind: "door", label: "Lab Door", roomId: "lab" }),
    entity({ id: "door-b", kind: "door", label: "Dome Door", roomId: "dome" }),
    entity({ id: "lens", kind: "goal", label: "Align the Lens", roomId: "dome" }),
  ],
  startRoomId: "lobby",
  goal: { id: "lens", roomId: "dome", requires: hasItem("key-b") },
});

export const routeAroundTrap: WorldSpec = sampleWorld({
  id: "g04-route-around-trap",
  title: "The Long Way Round",
  theme: "temple",
  prompt: "A temple whose bridge is trapped, with a longer tunnel around it.",
  rooms: [
    room("camp", "Camp", 0, 0),
    room("bridge", "Rope Bridge", 1, 0),
    room("shrine", "Shrine", 2, 0),
    room("tunnel", "Tunnel", 0, 1),
    room("cavern", "Cavern", 1, 1),
    room("passage", "Passage", 2, 1),
  ],
  connections: [
    connection("c1", "camp", "bridge"),
    connection("c2", "bridge", "shrine"),
    connection("c3", "camp", "tunnel"),
    connection("c4", "tunnel", "cavern"),
    connection("c5", "cavern", "passage"),
    connection("c6", "passage", "shrine"),
  ],
  entities: [
    entity({
      id: "snare",
      kind: "trap",
      label: "Bridge Snare",
      roomId: "shrine",
      blocksConnectionId: "c2",
    }),
    entity({ id: "idol", kind: "goal", label: "Lift the Idol", roomId: "shrine" }),
  ],
  startRoomId: "camp",
  goal: { id: "idol", roomId: "shrine", requires: alwaysTrue },
});

export const keyBehindOwnDoor: WorldSpec = observatoryKeyBehindDoor;

export const disconnectedGoal: WorldSpec = derive(observatory, {
  id: "f02-disconnected-goal",
  connections: [
    ...observatory.connections.filter((item) => item.id !== "c3"),
    connection("c4", "entrance", "control"),
  ],
});

export const lockWithNoUnlockPath: WorldSpec = derive(observatory, {
  id: "f05-no-unlock-path",
  entities: editEntity(observatory, "key1", { setsFlag: "alarm" }),
  connections: editConnection(observatory, "c2", {
    traversableWhen: allOf(hasItem("key1"), flag("alarm", false)),
  }),
});

export const twoLevelCycle: WorldSpec = sampleWorld({
  id: "two-level-cycle",
  title: "Crossed Keys",
  theme: "castle",
  prompt: "Each wing holds the key to the other wing.",
  rooms: [
    room("hall", "Great Hall", 0, 0),
    room("west", "West Wing", -1, 0),
    room("east", "East Wing", 1, 0),
    room("tower", "Tower", 1, 1),
  ],
  connections: [
    connection("c1", "hall", "west", hasItem("west-key"), "west-door"),
    connection("c2", "hall", "east", hasItem("east-key"), "east-door"),
    connection("c3", "east", "tower"),
  ],
  entities: [
    entity({
      id: "west-key",
      kind: "key",
      label: "West Key",
      roomId: "east",
      grantsItemId: "west-key",
    }),
    entity({
      id: "east-key",
      kind: "key",
      label: "East Key",
      roomId: "west",
      grantsItemId: "east-key",
    }),
    entity({ id: "west-door", kind: "door", label: "West Door", roomId: "west" }),
    entity({ id: "east-door", kind: "door", label: "East Door", roomId: "east" }),
    entity({ id: "banner", kind: "goal", label: "Raise the Banner", roomId: "tower" }),
  ],
  startRoomId: "hall",
  goal: { id: "banner", roomId: "tower", requires: alwaysTrue },
});

export const duplicateKeys: WorldSpec = derive(observatory, {
  id: "duplicate-keys",
  entities: [
    ...observatory.entities,
    entity({
      id: "spare-key",
      kind: "key",
      label: "Spare Key",
      roomId: "control",
      grantsItemId: "key1",
    }),
  ],
});
