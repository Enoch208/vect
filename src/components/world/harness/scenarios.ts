import { worldSpecSchema, type WorldSpec } from "../../../contract/world.schema.js";
import { connection, entity, hasItem } from "../../../fixtures/build.js";
import { observatory, observatoryKeyBehindDoor } from "../../../fixtures/observatory.js";
import { tenRoomTemple } from "../../../fixtures/suite-large.js";

const stress = worldSpecSchema.parse({
  ...tenRoomTemple,
  id: "decorated-ten-room-world",
  entities: [
    ...tenRoomTemple.entities,
    ...Array.from({ length: 10 }, (_, index) =>
      entity({
        id: `scenery-${String(index)}`,
        kind: "prop",
        label: `Display ${String(index + 1)}`,
        roomId: tenRoomTemple.rooms[index % tenRoomTemple.rooms.length]?.id ?? "atrium",
        localPosition: { x: index % 2 === 0 ? -0.65 : 0.65, y: 0, z: -0.65 },
      }),
    ),
  ],
});

const portals = worldSpecSchema.parse({
  ...observatory,
  id: "portal-clearance-world",
  connections: [
    ...observatory.connections,
    connection("shortcut", "entrance", "control", hasItem("key1")),
    connection("parallel", "entrance", "library"),
  ],
});

const longLabels = worldSpecSchema.parse({
  ...observatory,
  id: "long-label-world",
  entities: observatory.entities.map((item) =>
    item.id === "door1"
      ? {
          ...item,
          label: "The Extraordinarily Long Name Of A Door That Leads To Nowhere".slice(0, 60),
        }
      : item,
  ),
});

export const harnessWorlds: Record<string, { world: WorldSpec; script: WorldSpec }> = {
  observatory: { world: observatory, script: observatory },
  twin: { world: observatoryKeyBehindDoor, script: observatory },
  temple: { world: tenRoomTemple, script: tenRoomTemple },
  stress: { world: stress, script: stress },
  portals: { world: portals, script: portals },
  long: { world: longLabels, script: longLabels },
};
