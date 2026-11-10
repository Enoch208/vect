import { schemaVersion } from "../contract/versions.js";
import { worldLimits } from "../contract/limits.js";
import { worldSpecSchema, type WorldEntity, type WorldSpec } from "../contract/world.schema.js";
import { sha256Hex } from "../domain/canonical.js";
import type { WorldPlan } from "./world-plan.schema.js";

const seedModulus = 2_147_483_648;

export function seedFor(clientRequestId: string): number {
  const prefix = sha256Hex(clientRequestId).slice(0, 8);
  return Number.parseInt(prefix, 16) % seedModulus;
}

export function normalizePlan(
  plan: WorldPlan,
  context: {
    prompt: string;
    seed: number;
    createdAt: string;
    modelId: string;
    adaptations: string[];
  },
): WorldSpec {
  return worldSpecSchema.parse({
    schemaVersion,
    id: worldId(plan.title, context.seed),
    revision: 1,
    seed: context.seed,
    theme: plan.theme,
    title: plan.title,
    prompt: context.prompt,
    generationMode: "live_ai",
    rooms: plan.rooms.map((room) => ({
      ...room,
      grid: {
        x: clampGrid(room.grid.x),
        z: clampGrid(room.grid.z),
      },
    })),
    connections: plan.connections,
    entities: plan.entities.map(clampEntity),
    startRoomId: plan.startRoomId,
    goal: plan.goal,
    metadata: {
      createdAt: context.createdAt,
      modelId: context.modelId,
      adaptations: context.adaptations
        .slice(0, worldLimits.adaptations)
        .map((item) => item.slice(0, 200)),
    },
  });
}

function worldId(title: string, seed: number): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 41);
  const stem = slug.length === 0 ? "world" : slug;
  const suffix = seed.toString(36).padStart(6, "0").slice(0, 6);
  return `${stem}-${suffix}`;
}

function clampGrid(value: number): number {
  const rounded = Math.round(value);
  if (rounded < -worldLimits.gridExtent) return -worldLimits.gridExtent;
  if (rounded > worldLimits.gridExtent) return worldLimits.gridExtent;
  return rounded;
}

function clampEntity(entity: WorldEntity): WorldEntity {
  return {
    ...entity,
    localPosition: {
      x: clampUnit(entity.localPosition.x, -1, 1),
      y: clampUnit(entity.localPosition.y, 0, 1),
      z: clampUnit(entity.localPosition.z, -1, 1),
    },
  };
}

function clampUnit(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
