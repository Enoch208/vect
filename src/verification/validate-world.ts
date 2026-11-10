import { entityKinds, gateKinds, type EntityKind } from "../contract/codes.js";
import { kindLimits } from "../contract/limits.js";
import type { Finding } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { createInitialState } from "../domain/step-game.js";
import { entityById, roomById } from "../domain/world-lookup.js";
import { roomLabel, sentence, wayLabel } from "./describe.js";
import { missingReferenceFinding, missingReferences } from "./references.js";

const gates: readonly EntityKind[] = gateKinds;

const finding = (code: Finding["code"], entityIds: string[], text: string): Finding => ({
  code,
  entityIds,
  explanation: sentence(text),
});

function orphans(world: WorldSpec): Finding[] {
  const unknownRoom = (id: string) => roomById(world, id) === null;
  const connectionIds = new Set(world.connections.map((item) => item.id));
  return [
    ...world.entities
      .filter((item) => unknownRoom(item.roomId))
      .map((item) =>
        finding(
          "ORPHAN_ENTITY",
          [item.id],
          `${item.label} is placed in room "${item.roomId}", which does not exist`,
        ),
      ),
    ...world.connections.flatMap((item) =>
      [item.fromRoomId, item.toRoomId]
        .filter(unknownRoom)
        .map((roomId) =>
          finding(
            "ORPHAN_ENTITY",
            [item.id],
            `Connection ${item.id} leads to room "${roomId}", which does not exist`,
          ),
        ),
    ),
    ...(unknownRoom(world.startRoomId)
      ? [
          finding(
            "ORPHAN_ENTITY",
            [world.startRoomId],
            `The start room "${world.startRoomId}" does not exist`,
          ),
        ]
      : []),
    ...(unknownRoom(world.goal.roomId)
      ? [
          finding(
            "ORPHAN_ENTITY",
            [world.goal.id],
            `The goal room "${world.goal.roomId}" does not exist`,
          ),
        ]
      : []),
    ...world.connections
      .filter((item) => item.doorId !== null && entityById(world, item.doorId) === null)
      .map((item) =>
        finding(
          "ORPHAN_ENTITY",
          [item.id],
          `${wayLabel(world, item)} names door "${String(item.doorId)}", which does not exist`,
        ),
      ),
    ...world.entities
      .filter(
        (item) => item.blocksConnectionId !== null && !connectionIds.has(item.blocksConnectionId),
      )
      .map((item) =>
        finding(
          "ORPHAN_ENTITY",
          [item.id],
          `${item.label} blocks connection "${String(item.blocksConnectionId)}", which does not exist`,
        ),
      ),
  ];
}

function duplicates(ids: string[], noun: string): Finding[] {
  const repeated = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  return repeated.map((id) =>
    finding("INVALID_INTERACTION", [id], `Two or more ${noun} share the id "${id}"`),
  );
}

function badDeclarations(world: WorldSpec): Finding[] {
  const doors = world.connections.flatMap((item) => {
    const door = item.doorId === null ? null : entityById(world, item.doorId);
    if (door === null || gates.includes(door.kind)) return [];
    return [
      finding(
        "INVALID_INTERACTION",
        [item.id, door.id],
        `${wayLabel(world, item)} uses ${door.label} as its door, but only a door or portal can be one`,
      ),
    ];
  });
  const handlers = world.entities.flatMap((item) => {
    if ((item.kind === "key" || item.kind === "chest") && item.grantsItemId === null) {
      return [
        finding(
          "INVALID_INTERACTION",
          [item.id],
          `${item.label} is a ${item.kind} but gives no item`,
        ),
      ];
    }
    if (item.kind === "switch" && item.setsFlag === null) {
      return [
        finding(
          "INVALID_INTERACTION",
          [item.id],
          `${item.label} is a switch but switches nothing on`,
        ),
      ];
    }
    return [];
  });
  const loops = world.connections
    .filter((item) => item.fromRoomId === item.toRoomId)
    .map((item) =>
      finding(
        "INVALID_INTERACTION",
        [item.id],
        `Connection ${item.id} leads from ${roomLabel(world, item.fromRoomId)} back into itself`,
      ),
    );
  return [...doors, ...handlers, ...loops];
}

function overLimits(world: WorldSpec): Finding[] {
  return entityKinds.flatMap((kind) => {
    const ids = world.entities.filter((item) => item.kind === kind).map((item) => item.id);
    if (ids.length <= kindLimits[kind]) return [];
    return [
      finding(
        "INVALID_INTERACTION",
        ids,
        `This world has ${String(ids.length)} entities of kind ${kind}, but at most ${String(kindLimits[kind])} are allowed`,
      ),
    ];
  });
}

function goalProblems(world: WorldSpec): Finding[] {
  const marker = entityById(world, world.goal.id);
  const room = roomLabel(world, world.goal.roomId);
  if (marker === null || marker.kind !== "goal" || marker.roomId !== world.goal.roomId) {
    return [
      finding(
        "INVALID_INTERACTION",
        [world.goal.id],
        `The goal "${world.goal.id}" has no goal marker in ${room}`,
      ),
    ];
  }
  if (createInitialState(world, world.seed).won) {
    return [
      finding(
        "INVALID_INTERACTION",
        [world.goal.id],
        `The goal in ${room} is already complete when the game starts`,
      ),
    ];
  }
  return [];
}

export function validateWorld(world: WorldSpec): Finding[] {
  return [
    ...orphans(world),
    ...missingReferences(world).map((missing) => missingReferenceFinding(world, missing)),
    ...duplicates(
      world.rooms.map((item) => item.id),
      "rooms",
    ),
    ...duplicates(
      world.connections.map((item) => item.id),
      "connections",
    ),
    ...duplicates(
      world.entities.map((item) => item.id),
      "entities",
    ),
    ...badDeclarations(world),
    ...overLimits(world),
    ...goalProblems(world),
  ];
}
