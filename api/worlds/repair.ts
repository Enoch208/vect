import { repairRequestSchema } from "../../src/contract/api.schema.js";
import { repairWorld } from "../../src/generation/repair-world.js";
import { postRoute } from "../../src/server/route.js";

export const POST = postRoute(repairRequestSchema, repairWorld);
