import type { EntityKind } from "../../contract/codes.js";
import type { GameState } from "../../contract/game.schema.js";
import type { WorldEntity, WorldSpec } from "../../contract/world.schema.js";
import { layoutWorld } from "./layout.js";
import type { CorridorLayout, Point, SceneLayout } from "./layout-types.js";
import { flip, samePoint, turn, unit } from "./map-geometry.js";
import { isLit, type MapNotes } from "./map-notes.js";
import { planNotes } from "./map-plan.js";
import { assignTags, type MapTags } from "./map-tags.js";
import type { PaletteName } from "./palette.js";
import { gateStates, isUsed, type GateState } from "./truth.js";

const fadingKinds: readonly EntityKind[] = ["key", "chest", "checkpoint", "trap", "barrier"];

export type MapPlan = {
  layout: SceneLayout;
  tags: MapTags;
  notes: MapNotes;
  highlights: ReadonlySet<string>;
};

export type MapModel = MapPlan & {
  world: WorldSpec;
  state: GameState;
  gates: Map<string, GateState>;
};

export type GateView = {
  state: GateState;
  lit: boolean;
  tone: PaletteName;
  tags: string[];
};

export type GateFrame = { at: Point; out: Point; across: Point; aside: Point };

export function planMap(world: WorldSpec, highlightKey: string): MapPlan {
  const layout = layoutWorld(world);
  const highlights = new Set(highlightKey.split(" ").filter((id) => id !== ""));
  const tags = assignTags(world, layout);
  return { layout, tags, notes: planNotes(world, layout, tags, highlights), highlights };
}

export function buildModel(plan: MapPlan, world: WorldSpec, state: GameState): MapModel {
  return { ...plan, world, state, gates: gateStates(world, state) };
}

export function isSpent(model: MapModel, entity: WorldEntity): boolean {
  return fadingKinds.includes(entity.kind) && isUsed(model.state, entity.id);
}

export function isDrawn(
  model: MapModel,
  entity: WorldEntity,
  gateIds: ReadonlySet<string>,
): boolean {
  return !gateIds.has(entity.id) && !(entity.kind === "key" && isSpent(model, entity));
}

export function hasGate(corridor: CorridorLayout): boolean {
  return corridor.gated || corridor.gateEntityId !== null;
}

export function gateEntityIds(layout: SceneLayout): Set<string> {
  return new Set(layout.corridors.flatMap((corridor) => corridor.gateEntityId ?? []));
}

export function viewGate(model: MapModel, corridor: CorridorLayout): GateView {
  const state = model.gates.get(corridor.connectionId) ?? "closed";
  const lit = isLit(model.highlights, corridor);
  return {
    state,
    lit,
    tone: lit || state === "closed" ? "accent" : "ink",
    tags: model.tags.connection.get(corridor.connectionId) ?? [],
  };
}

export function frameGate(corridor: CorridorLayout): GateFrame {
  const along = unit(corridor.from, corridor.to);
  const out = samePoint(corridor.gate, corridor.to) ? flip(along) : along;
  const across = turn(out);
  return {
    at: corridor.gate,
    out,
    across,
    aside: across[0] + across[1] > 0 ? across : flip(across),
  };
}
