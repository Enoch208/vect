import type { SolvabilityStatus } from "../contract/codes.js";
import type { GameAction, GameState } from "../contract/game.schema.js";
import type { Finding } from "../contract/report.schema.js";
import type { WorldSpec } from "../contract/world.schema.js";
import { canonicalJson } from "../domain/canonical.js";
import { candidateActions, createInitialState, stepGame } from "../domain/step-game.js";
import { diagnose } from "./diagnose.js";
import type { Explored } from "./needs.js";

export const defaultMaxStates = 100_000;

export type SolveResult = {
  status: SolvabilityStatus;
  path: GameAction[] | null;
  exploredStates: number;
  findings: Finding[];
};

type Visit = { parent: string | null; action: GameAction | null };

function searchKey(state: GameState): string {
  return canonicalJson({
    currentRoomId: state.currentRoomId,
    inventory: state.inventory,
    activeFlags: state.activeFlags,
    unlockedDoors: state.unlockedDoors,
    collectedEntities: state.collectedEntities,
  });
}

function pathTo(visits: ReadonlyMap<string, Visit>, key: string): GameAction[] {
  const path: GameAction[] = [];
  let visit = visits.get(key);
  while (visit !== undefined && visit.action !== null && visit.parent !== null) {
    path.push(visit.action);
    visit = visits.get(visit.parent);
  }
  return path.reverse();
}

function record(explored: Explored, state: GameState): void {
  explored.rooms.add(state.currentRoomId);
  for (const item of state.inventory) explored.items.add(item);
  for (const [flagId, on] of Object.entries(state.activeFlags)) if (on) explored.flags.add(flagId);
}

function budgetExhausted(exploredStates: number): SolveResult {
  return {
    status: "INCONCLUSIVE",
    path: null,
    exploredStates,
    findings: [
      {
        code: "TEST_BUDGET_EXHAUSTED",
        entityIds: [],
        explanation: `The solver stopped at its budget of ${String(exploredStates)} states before finishing, so it cannot say whether this world can be completed.`,
      },
    ],
  };
}

export function solve(world: WorldSpec, options: { maxStates?: number } = {}): SolveResult {
  const maxStates = options.maxStates ?? defaultMaxStates;
  const initial = createInitialState(world, world.seed);
  if (initial.won) return { status: "SOLVABLE", path: [], exploredStates: 1, findings: [] };
  const startKey = searchKey(initial);
  const visits = new Map<string, Visit>([[startKey, { parent: null, action: null }]]);
  const explored: Explored = { rooms: new Set(), items: new Set(), flags: new Set() };
  record(explored, initial);
  const queue: Array<{ key: string; state: GameState }> = [{ key: startKey, state: initial }];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    if (node === undefined) break;
    for (const action of candidateActions(world, node.state)) {
      const transition = stepGame(world, node.state, action);
      if (!transition.ok) continue;
      const key = searchKey(transition.state);
      if (visits.has(key)) continue;
      if (transition.state.won) {
        visits.set(key, { parent: node.key, action });
        return {
          status: "SOLVABLE",
          path: pathTo(visits, key),
          exploredStates: visits.size,
          findings: [],
        };
      }
      if (visits.size >= maxStates) return budgetExhausted(visits.size);
      visits.set(key, { parent: node.key, action });
      record(explored, transition.state);
      queue.push({ key, state: transition.state });
    }
  }
  return {
    status: "PROVEN_UNREACHABLE",
    path: null,
    exploredStates: visits.size,
    findings: diagnose(world, explored),
  };
}
