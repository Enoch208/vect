import { worldSpecSchema, type WorldSpec } from "../contract/world.schema.js";
import { connection, entity, flag, hasItem } from "./build.js";

export const observatory: WorldSpec = worldSpecSchema.parse({
  schemaVersion: 1,
  id: "observatory-01",
  revision: 1,
  seed: 94712,
  theme: "observatory",
  title: "The Last Observatory",
  prompt: "Create an observatory with a library key and a locked control room.",
  generationMode: "sample_fixture",
  rooms: [
    { id: "entrance", label: "Entrance", grid: { x: 0, z: 0 }, prefab: "medium" },
    { id: "library", label: "Library", grid: { x: 1, z: 0 }, prefab: "small" },
    { id: "control", label: "Control Room", grid: { x: 2, z: 0 }, prefab: "medium" },
    { id: "portal", label: "Portal Chamber", grid: { x: 3, z: 0 }, prefab: "large" },
  ],
  connections: [
    connection("c1", "entrance", "library"),
    connection("c2", "library", "control", hasItem("key1"), "door1"),
    connection("c3", "control", "portal", flag("portal-enabled"), "gate1"),
  ],
  entities: [
    entity({
      id: "key1",
      kind: "key",
      label: "Access Key",
      roomId: "library",
      localPosition: { x: 0.4, y: 0.3, z: -0.3 },
      grantsItemId: "key1",
      presentation: { variant: null, glow: true },
    }),
    entity({ id: "door1", kind: "door", label: "Control Room Door", roomId: "control" }),
    entity({
      id: "switch1",
      kind: "switch",
      label: "Portal Switch",
      roomId: "control",
      localPosition: { x: -0.5, y: 0.4, z: 0.2 },
      setsFlag: "portal-enabled",
      presentation: { variant: null, glow: true },
    }),
    entity({ id: "gate1", kind: "portal", label: "Portal Gate", roomId: "portal" }),
    entity({ id: "goal1", kind: "goal", label: "Reach the Portal", roomId: "portal" }),
    entity({
      id: "charts",
      kind: "prop",
      label: "Star Charts",
      roomId: "library",
      localPosition: { x: -0.6, y: 0, z: 0.5 },
    }),
    entity({
      id: "telescope",
      kind: "prop",
      label: "Brass Telescope",
      roomId: "entrance",
      localPosition: { x: 0.5, y: 0, z: 0.5 },
    }),
  ],
  startRoomId: "entrance",
  goal: { id: "goal1", roomId: "portal", requires: flag("portal-enabled") },
  metadata: { createdAt: "2026-11-10T00:00:00.000Z", modelId: null, adaptations: [] },
});

export const observatoryKeyBehindDoor: WorldSpec = worldSpecSchema.parse({
  ...observatory,
  revision: 2,
  entities: observatory.entities.map((item) =>
    item.id === "key1" ? { ...item, roomId: "control" } : item,
  ),
});
