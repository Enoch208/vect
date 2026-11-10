import { kindLimits } from "../contract/limits.js";
import type { PatchOperation, WorldPatch } from "../contract/patch.schema.js";
import type { Finding } from "../contract/report.schema.js";
import type { Connection, Room, WorldEntity, WorldSpec } from "../contract/world.schema.js";
import { applyPatch } from "../domain/apply-patch.js";
import { worldRevisionHash } from "../domain/canonical.js";
import { entityById, isInteractive, roomById } from "../domain/world-lookup.js";
import { checkWorld } from "../verification/check-world.js";
import { reachableIgnoringGates } from "../verification/graph.js";
import { intentViolations } from "../verification/intent.js";
import { missingReferences, type MissingReference } from "../verification/references.js";

type Candidate = { intent: string; operations: PatchOperation[] };

const maxCandidates = 10;

function distance(a: Room, b: Room): number {
  return Math.abs(a.grid.x - b.grid.x) + Math.abs(a.grid.z - b.grid.z);
}

function roomsNear(world: WorldSpec, anchors: string[]): Room[] {
  const anchorRooms = anchors.flatMap((id) => roomById(world, id) ?? []);
  const gap = (room: Room) => Math.min(...anchorRooms.map((anchor) => distance(room, anchor)));
  const rank = (room: Room) =>
    anchors.includes(room.id) ? anchors.indexOf(room.id) - anchors.length : gap(room);
  return [...world.rooms].sort((a, b) => rank(a) - rank(b));
}

function freeId(preferred: string, taken: (id: string) => boolean): string {
  const stem = preferred.slice(0, 40);
  if (!taken(stem)) return stem;
  for (let n = 2; ; n++) if (!taken(`${stem}-${String(n)}`)) return `${stem}-${String(n)}`;
}

function titled(id: string): string {
  return id
    .split(/[-_]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function relocations(world: WorldSpec, finding: Finding): Candidate[] {
  const provider = finding.entityIds
    .map((id) => entityById(world, id))
    .find((item): item is WorldEntity => item !== null && isInteractive(item));
  if (provider === undefined) return [];
  const gate = world.connections.find((item) => finding.entityIds.includes(item.id));
  const anchors = gate === undefined ? [world.startRoomId] : [gate.fromRoomId, gate.toRoomId];
  return roomsNear(world, anchors)
    .filter((room) => room.id !== provider.roomId)
    .map((room) => ({
      intent: `Move ${provider.label} to ${room.label}, where it can be reached before the way it opens`,
      operations: [
        { op: "moveEntity", entityId: provider.id, toRoomId: room.id, localPosition: null },
      ],
    }));
}

function bridges(world: WorldSpec): Candidate[] {
  const near = reachableIgnoringGates(world, [world.startRoomId]);
  const far = reachableIgnoringGates(world, [world.goal.roomId]);
  if ([...far].some((id) => near.has(id))) return [];
  const id = freeId("repair-link", (name) => world.connections.some((item) => item.id === name));
  const pairs = world.rooms
    .filter((a) => near.has(a.id))
    .flatMap((a) => world.rooms.filter((b) => far.has(b.id)).map((b) => ({ a, b })))
    .sort((x, y) => distance(x.a, x.b) - distance(y.a, y.b));
  return pairs.map(({ a, b }) => {
    const connection: Connection = {
      id,
      fromRoomId: a.id,
      toRoomId: b.id,
      doorId: null,
      traversableWhen: { op: "true" },
    };
    return {
      intent: `Connect ${a.label} to ${b.label} so ${roomById(world, world.goal.roomId)?.label ?? "the goal"} can be reached`,
      operations: [{ op: "addConnection", connection }],
    };
  });
}

function anchorsOf(world: WorldSpec, missing: MissingReference): string[] {
  const { source } = missing;
  if (source.type === "connection")
    return [source.connection.fromRoomId, source.connection.toRoomId];
  if (source.type === "entity") return [source.entity.roomId];
  return [world.goal.roomId];
}

function providerFor(
  world: WorldSpec,
  missing: MissingReference,
  id: string,
  roomId: string,
): WorldEntity {
  const count = (kind: WorldEntity["kind"]) =>
    world.entities.filter((item) => item.kind === kind).length;
  const isItem = missing.kind === "item";
  const kind = isItem
    ? count("key") < kindLimits.key
      ? "key"
      : "chest"
    : count("switch") < kindLimits.switch
      ? "switch"
      : "checkpoint";
  return {
    id,
    kind,
    label: isItem ? titled(missing.id) : `${titled(missing.id)} Switch`,
    roomId,
    localPosition: { x: 0.5, y: 0.3, z: -0.5 },
    requires: { op: "true" },
    grantsItemId: isItem ? missing.id : null,
    setsFlag: isItem ? null : missing.id,
    consumesItemId: null,
    blocksConnectionId: null,
    presentation: { variant: null, glow: true },
  };
}

function restorations(world: WorldSpec): Candidate[] {
  const seen = new Set<string>();
  const needs = missingReferences(world).filter((item) => {
    const tag = `${item.kind}:${item.id}`;
    if (seen.has(tag)) return false;
    seen.add(tag);
    return true;
  });
  if (needs.length === 0) return [];
  const taken = new Set(world.entities.map((item) => item.id));
  const ids = needs.map((need) => {
    const id = freeId(need.id, (name) => taken.has(name));
    taken.add(id);
    return id;
  });
  return world.rooms.map((_, rank) => {
    const placed = needs.map((need, index) => {
      const rooms = roomsNear(world, anchorsOf(world, need));
      const room = rooms[rank % rooms.length] ?? rooms[0];
      return providerFor(world, need, ids[index] ?? need.id, room?.id ?? world.startRoomId);
    });
    const where = placed.map(
      (item) => `${item.label} in ${roomById(world, item.roomId)?.label ?? item.roomId}`,
    );
    return {
      intent: `Add ${where.join(" and ")}, which the world needs but nothing provided`,
      operations: placed.map((item): PatchOperation => ({ op: "addEntity", entity: item })),
    };
  });
}

function firstWorking(world: WorldSpec, candidates: Candidate[]): WorldPatch | null {
  const baseRevisionHash = worldRevisionHash(world);
  for (const candidate of candidates.slice(0, maxCandidates)) {
    const patch: WorldPatch = {
      baseRevisionHash,
      intent: candidate.intent.slice(0, 200),
      operations: candidate.operations,
    };
    const applied = applyPatch(world, patch);
    if (!applied.ok || intentViolations(world, applied.candidate).length > 0) continue;
    if (checkWorld(applied.candidate).solvability?.status === "SOLVABLE") return patch;
  }
  return null;
}

export function proposeRuleRepair(world: WorldSpec, finding: Finding): WorldPatch | null {
  switch (finding.code) {
    case "CIRCULAR_DEPENDENCY":
      return firstWorking(world, relocations(world, finding));
    case "UNREACHABLE_GOAL":
      return firstWorking(world, bridges(world));
    case "MISSING_REQUIRED_ITEM":
      return firstWorking(world, restorations(world));
    case "BLOCKED_EDGE":
    case "ORPHAN_ENTITY":
    case "INVALID_INTERACTION":
    case "TEST_BUDGET_EXHAUSTED":
    case "UNKNOWN_FAILURE":
      return null;
  }
}
