import { editRequestSchema } from "../../src/contract/api.schema.js";
import { editWorld } from "../../src/generation/edit-world.js";
import { postRoute } from "../../src/server/route.js";

export const POST = postRoute(editRequestSchema, editWorld);
