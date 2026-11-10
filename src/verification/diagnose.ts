import type { Finding } from "../contract/report.schema.js";
import type { WorldEntity, WorldSpec } from "../contract/world.schema.js";
import { blockersOf, entityById } from "../domain/world-lookup.js";
import { roomLabel, sentence, wayLabel } from "./describe.js";
import { frontierOf, reachableIgnoringGates, type FrontierGate } from "./graph.js";
import {
  entityNeeds,
  necessaryNeeds,
  needName,
  neverObtained,
  providersOf,
  type Explored,
  type Need,
} from "./needs.js";

type Diagnosis = { world: WorldSpec; explored: Explored; beyond: Set<string> };

const finding = (code: Finding["code"], entityIds: string[], text: string): Finding => ({
  code,
  entityIds: [...new Set(entityIds)],
  explanation: sentence(text),
});

function gateName(world: WorldSpec, gate: FrontierGate): string {
  const door = gate.connection.doorId === null ? null : entityById(world, gate.connection.doorId);
  return door?.label ?? wayLabel(world, gate.connection);
}

function gateIds(gate: FrontierGate): string[] {
  const { connection } = gate;
  return connection.doorId === null ? [connection.id] : [connection.id, connection.doorId];
}

function outsideProviders(
  d: Diagnosis,
  need: Need,
  seen: ReadonlySet<string>,
): WorldEntity[] | null {
  const tag = `${need.kind}:${need.id}`;
  const providers = providersOf(d.world, need);
  if (seen.has(tag) || providers.length === 0) return null;
  const found: WorldEntity[] = [];
  for (const provider of providers) {
    if (!d.explored.rooms.has(provider.roomId)) {
      if (!d.beyond.has(provider.roomId)) return null;
      found.push(provider);
      continue;
    }
    const deeper = neverObtained(d.explored, entityNeeds(provider))
      .map((sub) => outsideProviders(d, sub, new Set([...seen, tag])))
      .find((result) => result !== null);
    if (deeper === undefined) return null;
    found.push(...deeper);
  }
  return found;
}

function circularFinding(d: Diagnosis, gate: FrontierGate): Finding | null {
  const needs = neverObtained(d.explored, necessaryNeeds(gate.connection.traversableWhen));
  for (const need of needs) {
    const outside = outsideProviders(d, need, new Set());
    if (outside === null) continue;
    const far = reachableIgnoringGates(d.world, [gate.outside], d.explored.rooms);
    const where = outside.every((item) => far.has(item.roomId))
      ? "behind that same door"
      : "beyond another locked way";
    const rooms = [...new Set(outside.map((item) => roomLabel(d.world, item.roomId)))].join(
      " and ",
    );
    const wanted = needName(d.world, need);
    const direct = outside.every((item) => providersOf(d.world, need).includes(item));
    const tail = direct
      ? `but ${wanted.replace(/ switched on$/, "")} is only found in ${rooms}, ${where}`
      : `which depends on ${outside.map((item) => item.label).join(" and ")} in ${rooms}, ${where}`;
    return finding(
      "CIRCULAR_DEPENDENCY",
      [...outside.map((item) => item.id), ...gateIds(gate)],
      `${gateName(d.world, gate)} needs ${wanted}, ${tail}`,
    );
  }
  return null;
}

function blockedFinding(d: Diagnosis, gate: FrontierGate): Finding {
  const blockers = blockersOf(d.world, gate.connection);
  const ids = [...gateIds(gate), ...blockers.map((item) => item.id)];
  const stuck = blockers.filter((item) => !d.explored.rooms.has(item.roomId));
  if (stuck.length > 0) {
    const names = stuck.map((item) => item.label).join(" and ");
    return finding(
      "BLOCKED_EDGE",
      ids,
      `${wayLabel(d.world, gate.connection)} is blocked by ${names}, which can only be cleared from the other side`,
    );
  }
  return finding(
    "BLOCKED_EDGE",
    ids,
    `${gateName(d.world, gate)} never opens from ${roomLabel(d.world, gate.inside)}, because its condition is never met`,
  );
}

function unmetGoal(d: Diagnosis): Finding {
  const { goal } = d.world;
  const room = roomLabel(d.world, goal.roomId);
  const needs = neverObtained(d.explored, necessaryNeeds(goal.requires));
  if (needs.length === 0) {
    return finding(
      "UNREACHABLE_GOAL",
      [goal.id],
      `The goal in ${room} never holds while the player is there`,
    );
  }
  const names = needs.map((need) => needName(d.world, need)).join(" and ");
  const providers = needs.flatMap((need) => providersOf(d.world, need).map((item) => item.id));
  return finding(
    "UNREACHABLE_GOAL",
    [goal.id, ...providers],
    `The goal in ${room} needs ${names}, which the player can never get`,
  );
}

export function diagnose(world: WorldSpec, explored: Explored): Finding[] {
  const connected = reachableIgnoringGates(world, [world.startRoomId]);
  if (!connected.has(world.goal.roomId)) {
    return [
      finding(
        "UNREACHABLE_GOAL",
        [world.goal.id],
        `${roomLabel(world, world.goal.roomId)} cannot be reached from ${roomLabel(world, world.startRoomId)} by any route, even with every door open`,
      ),
    ];
  }
  const d: Diagnosis = { world, explored, beyond: connected };
  const frontier = frontierOf(world, explored.rooms);
  const circular = frontier.flatMap((gate) => circularFinding(d, gate) ?? []);
  if (circular.length > 0) return circular;
  if (explored.rooms.has(world.goal.roomId)) return [unmetGoal(d)];
  if (frontier.length > 0) return frontier.map((gate) => blockedFinding(d, gate));
  return [
    finding(
      "UNKNOWN_FAILURE",
      [world.goal.id],
      "The solver found no way to finish this world but could not name a single cause",
    ),
  ];
}
