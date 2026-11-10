import type { WorldSpec } from "../contract/world.schema.js";
import { alwaysTrue } from "../contract/expr.schema.js";
import { connection, derive, editConnection, editEntity, entity, flag, hasItem } from "./build.js";
import { observatory } from "./observatory.js";

export const doorNeedsMissingKey: WorldSpec = derive(observatory, {
  id: "f03-missing-key",
  connections: editConnection(observatory, "c2", { traversableWhen: hasItem("ghost-key") }),
});

export const entityInMissingRoom: WorldSpec = derive(observatory, {
  id: "f04-orphan-entity",
  entities: editEntity(observatory, "charts", { roomId: "attic" }),
});

export const gateOnUnsetFlag: WorldSpec = derive(observatory, {
  id: "flag-nobody-sets",
  connections: editConnection(observatory, "c3", { traversableWhen: flag("power-on") }),
});

export const goalCompleteAtStart: WorldSpec = derive(observatory, {
  id: "goal-at-start",
  entities: editEntity(observatory, "goal1", { roomId: "entrance" }),
  goal: { id: "goal1", roomId: "entrance", requires: alwaysTrue },
});

export const duplicateEntityIds: WorldSpec = derive(observatory, {
  id: "duplicate-ids",
  entities: [
    ...observatory.entities,
    entity({ id: "charts", kind: "prop", label: "Spare Charts", roomId: "entrance" }),
  ],
});

export const fourKeys: WorldSpec = derive(observatory, {
  id: "four-keys",
  entities: [
    ...observatory.entities,
    ...["k2", "k3", "k4"].map((id) =>
      entity({ id, kind: "key", label: `Key ${id}`, roomId: "entrance", grantsItemId: id }),
    ),
  ],
});

export const doorIsAProp: WorldSpec = derive(observatory, {
  id: "door-is-a-prop",
  connections: editConnection(observatory, "c2", { doorId: "charts" }),
});

export const silentSwitch: WorldSpec = derive(observatory, {
  id: "silent-switch",
  entities: editEntity(observatory, "switch1", { setsFlag: null }),
  connections: editConnection(observatory, "c3", { traversableWhen: alwaysTrue }),
  goal: { ...observatory.goal, requires: alwaysTrue },
});

export const selfLoop: WorldSpec = derive(observatory, {
  id: "self-loop",
  connections: [...observatory.connections, connection("c4", "library", "library")],
});

export const keyHeldByProp: WorldSpec = derive(observatory, {
  id: "key-held-by-prop",
  entities: editEntity(observatory, "key1", { kind: "prop" }),
});
