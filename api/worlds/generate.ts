import { generateRequestSchema } from "../../src/contract/api.schema.js";
import { generateWorld } from "../../src/generation/generate-world.js";
import { postRoute } from "../../src/server/route.js";

export const POST = postRoute(generateRequestSchema, generateWorld);
