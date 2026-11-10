import type { PatchOperation, WorldPatch } from "../contract/patch.schema.js";
import { worldSpecSchema, type WorldSpec } from "../contract/world.schema.js";
import { worldRevisionHash } from "./canonical.js";
import { entityById, roomById } from "./world-lookup.js";

export type PatchResult =
  | { ok: true; candidate: WorldSpec; revisionHash: string }
  | { ok: false; reason: string; operationIndex: number | null };

type Step = { ok: true; world: WorldSpec } | { ok: false; reason: string };

const done = (world: WorldSpec): Step => ({ ok: true, world });
const refuse = (reason: string): Step => ({ ok: false, reason });

function missingRoom(world: WorldSpec, roomId: string): Step | null {
  return roomById(world, roomId) === null ? refuse(`There is no room called ${roomId}.`) : null;
}

function missingEntity(world: WorldSpec, entityId: string): Step | null {
  return entityById(world, entityId) === null
    ? refuse(`There is no entity called ${entityId}.`)
    : null;
}

function missingConnection(world: WorldSpec, connectionId: string): Step | null {
  return world.connections.some((item) => item.id === connectionId)
    ? null
    : refuse(`There is no connection called ${connectionId}.`);
}

function addRoom(world: WorldSpec, op: Extract<PatchOperation, { op: "addRoom" }>): Step {
  if (roomById(world, op.room.id) !== null) return refuse(`A room ${op.room.id} already exists.`);
  return done({ ...world, rooms: [...world.rooms, op.room] });
}

function addEntity(world: WorldSpec, op: Extract<PatchOperation, { op: "addEntity" }>): Step {
  if (entityById(world, op.entity.id) !== null) {
    return refuse(`An entity ${op.entity.id} already exists.`);
  }
  return (
    missingRoom(world, op.entity.roomId) ??
    done({ ...world, entities: [...world.entities, op.entity] })
  );
}

function moveEntity(world: WorldSpec, op: Extract<PatchOperation, { op: "moveEntity" }>): Step {
  const blocked = missingEntity(world, op.entityId) ?? missingRoom(world, op.toRoomId);
  if (blocked !== null) return blocked;
  const entities = world.entities.map((item) =>
    item.id === op.entityId
      ? { ...item, roomId: op.toRoomId, localPosition: op.localPosition ?? item.localPosition }
      : item,
  );
  return done({ ...world, entities });
}

function removeEntity(world: WorldSpec, entityId: string): Step {
  const blocked = missingEntity(world, entityId);
  if (blocked !== null) return blocked;
  return done({
    ...world,
    entities: world.entities.filter((item) => item.id !== entityId),
    connections: world.connections.map((item) =>
      item.doorId === entityId ? { ...item, doorId: null } : item,
    ),
  });
}

function addConnection(
  world: WorldSpec,
  op: Extract<PatchOperation, { op: "addConnection" }>,
): Step {
  const { connection } = op;
  if (world.connections.some((item) => item.id === connection.id)) {
    return refuse(`A connection ${connection.id} already exists.`);
  }
  const blocked =
    missingRoom(world, connection.fromRoomId) ??
    missingRoom(world, connection.toRoomId) ??
    (connection.doorId === null ? null : missingEntity(world, connection.doorId));
  return blocked ?? done({ ...world, connections: [...world.connections, connection] });
}

function removeConnection(world: WorldSpec, connectionId: string): Step {
  const blocked = missingConnection(world, connectionId);
  if (blocked !== null) return blocked;
  const blocker = world.entities.find((item) => item.blocksConnectionId === connectionId);
  if (blocker !== undefined) {
    return refuse(`${blocker.label} still blocks connection ${connectionId}; remove it first.`);
  }
  return done({
    ...world,
    connections: world.connections.filter((item) => item.id !== connectionId),
  });
}

function setConnectionPredicate(
  world: WorldSpec,
  op: Extract<PatchOperation, { op: "setConnectionPredicate" }>,
): Step {
  const blocked =
    missingConnection(world, op.connectionId) ??
    (op.doorId === null ? null : missingEntity(world, op.doorId));
  if (blocked !== null) return blocked;
  const connections = world.connections.map((item) =>
    item.id === op.connectionId
      ? { ...item, traversableWhen: op.predicate, doorId: op.doorId }
      : item,
  );
  return done({ ...world, connections });
}

function setEntityRequirement(
  world: WorldSpec,
  op: Extract<PatchOperation, { op: "setEntityRequirement" }>,
): Step {
  const blocked = missingEntity(world, op.entityId);
  if (blocked !== null) return blocked;
  const entities = world.entities.map((item) =>
    item.id === op.entityId ? { ...item, requires: op.requires } : item,
  );
  return done({ ...world, entities });
}

function applyOperation(world: WorldSpec, op: PatchOperation): Step {
  switch (op.op) {
    case "addRoom":
      return addRoom(world, op);
    case "addEntity":
      return addEntity(world, op);
    case "moveEntity":
      return moveEntity(world, op);
    case "removeEntity":
      return removeEntity(world, op.entityId);
    case "addConnection":
      return addConnection(world, op);
    case "removeConnection":
      return removeConnection(world, op.connectionId);
    case "setConnectionPredicate":
      return setConnectionPredicate(world, op);
    case "setEntityRequirement":
      return setEntityRequirement(world, op);
    case "setGoalPredicate":
      return done({ ...world, goal: { ...world.goal, requires: op.predicate } });
    case "setTheme":
      return done({ ...world, theme: op.theme });
  }
}

export function applyPatch(world: WorldSpec, patch: WorldPatch): PatchResult {
  if (patch.baseRevisionHash !== worldRevisionHash(world)) {
    return {
      ok: false,
      reason: "STALE_REVISION: the patch was written for a different revision of this world.",
      operationIndex: null,
    };
  }
  let working = structuredClone(world);
  for (const [index, op] of patch.operations.entries()) {
    const step = applyOperation(working, op);
    if (!step.ok) return { ok: false, reason: step.reason, operationIndex: index };
    working = step.world;
  }
  const parsed = worldSpecSchema.safeParse({ ...working, revision: working.revision + 1 });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue === undefined ? "the world" : issue.path.join(".") || "the world";
    const message = issue?.message ?? "invalid";
    return {
      ok: false,
      reason: `The edited world is invalid at ${where}: ${message}.`,
      operationIndex: null,
    };
  }
  return { ok: true, candidate: parsed.data, revisionHash: worldRevisionHash(parsed.data) };
}
