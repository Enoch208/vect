import type { FailureCode } from "../contract/codes.js";
import type { Connection, WorldSpec } from "../contract/world.schema.js";
import { connection, derive, editEntity, hasItem } from "./build.js";
import { observatory } from "./observatory.js";
import { backtrackingWorld } from "./suite-agent.js";
import {
  keyBeforeDoor,
  routeAroundTrap,
  switchBehindOpenRoute,
  twoLevelCycle,
  twoSequentialLocks,
} from "./suite-gameplay.js";
import { tenRoomTemple } from "./suite-large.js";

export type RepairFixture = { id: string; world: WorldSpec; finding: FailureCode };

function moved(base: WorldSpec, id: string, entityId: string, roomId: string): WorldSpec {
  return derive(base, {
    id,
    revision: base.revision + 1,
    entities: editEntity(base, entityId, { roomId }),
  });
}

function removed(base: WorldSpec, id: string, entityId: string): WorldSpec {
  return derive(base, {
    id,
    revision: base.revision + 1,
    entities: base.entities.filter((item) => item.id !== entityId),
  });
}

function cut(
  base: WorldSpec,
  id: string,
  connectionIds: string[],
  added: Connection[] = [],
): WorldSpec {
  const dropped = new Set(connectionIds);
  return derive(base, {
    id,
    revision: base.revision + 1,
    connections: [...base.connections.filter((item) => !dropped.has(item.id)), ...added],
    entities: base.entities.filter(
      (item) => item.blocksConnectionId === null || !dropped.has(item.blocksConnectionId),
    ),
  });
}

const circular = (world: WorldSpec): RepairFixture => ({
  id: world.id,
  world,
  finding: "CIRCULAR_DEPENDENCY",
});
const missing = (world: WorldSpec): RepairFixture => ({
  id: world.id,
  world,
  finding: "MISSING_REQUIRED_ITEM",
});
const unreachable = (world: WorldSpec): RepairFixture => ({
  id: world.id,
  world,
  finding: "UNREACHABLE_GOAL",
});

export const repairFixtures: RepairFixture[] = [
  circular(moved(observatory, "r-obs-key-in-control", "key1", "control")),
  circular(moved(observatory, "r-obs-key-in-portal", "key1", "portal")),
  circular(moved(observatory, "r-obs-switch-in-portal", "switch1", "portal")),
  missing(removed(observatory, "r-obs-key-deleted", "key1")),
  missing(removed(observatory, "r-obs-switch-deleted", "switch1")),
  unreachable(
    cut(observatory, "r-obs-portal-cut", ["c3"], [connection("c4", "entrance", "control")]),
  ),
  circular(moved(keyBeforeDoor, "r-castle-key-in-throne", "iron-key", "throne")),
  missing(removed(keyBeforeDoor, "r-castle-key-deleted", "iron-key")),
  missing(
    derive(keyBeforeDoor, {
      id: "r-castle-goal-needs-jewel",
      goal: { ...keyBeforeDoor.goal, requires: hasItem("crown-jewel") },
    }),
  ),
  circular(moved(switchBehindOpenRoute, "r-temple-brazier-at-altar", "brazier", "altar")),
  unreachable(
    cut(switchBehindOpenRoute, "r-temple-altar-cut", ["c3"], [connection("c4", "steps", "crypt")]),
  ),
  circular(moved(twoSequentialLocks, "r-locks-first-key-in-lab", "key-a", "lab")),
  circular(moved(twoSequentialLocks, "r-locks-second-key-in-dome", "key-b", "dome")),
  circular(moved(twoSequentialLocks, "r-locks-first-key-in-dome", "key-a", "dome")),
  missing(removed(twoSequentialLocks, "r-locks-first-key-deleted", "key-a")),
  unreachable(cut(routeAroundTrap, "r-trap-shrine-cut", ["c2", "c6"])),
  circular(moved(tenRoomTemple, "r-large-gold-in-sanctum", "gold", "sanctum")),
  circular(moved(tenRoomTemple, "r-large-silver-in-vault", "silver", "vault")),
  circular(moved(tenRoomTemple, "r-large-bronze-in-east", "bronze", "east")),
  circular(moved(tenRoomTemple, "r-large-seal-in-sanctum", "lever-c", "sanctum")),
  unreachable(cut(tenRoomTemple, "r-large-sanctum-cut", ["c9"])),
  circular(moved(backtrackingWorld, "r-wings-key-in-hall", "east-key", "e1")),
  circular(moved(backtrackingWorld, "r-wings-beacon-in-keep", "beacon", "e2")),
  missing(removed(backtrackingWorld, "r-wings-key-deleted", "east-key")),
  unreachable(cut(backtrackingWorld, "r-wings-keep-cut", ["c7"])),
  circular(twoLevelCycle),
];
