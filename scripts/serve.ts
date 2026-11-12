import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import * as health from "../api/health.js";
import * as edit from "../api/worlds/edit.js";
import * as generate from "../api/worlds/generate.js";
import * as repair from "../api/worlds/repair.js";
import { plainError, sendWeb, toWebRequest } from "../node-bridge.js";

type Handler = (request: Request) => Response | Promise<Response>;

const routes = new Map<string, Readonly<Partial<Record<string, Handler>>>>([
  ["/api/health", { GET: health.GET }],
  ["/api/worlds/generate", { POST: generate.POST }],
  ["/api/worlds/edit", { POST: edit.POST }],
  ["/api/worlds/repair", { POST: repair.POST }],
]);

const { HOST, PORT } = z
  .object({
    HOST: z.string().min(1).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(8830),
  })
  .parse(process.env);

async function respond(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${HOST}`);
  const methods = routes.get(url.pathname);
  if (methods === undefined) {
    await sendWeb(res, plainError(404, "NOT_FOUND", `No route for ${url.pathname}`));
    return;
  }
  const method = req.method ?? "GET";
  const handler = methods[method];
  if (handler === undefined) {
    const message = `${method} is not allowed on ${url.pathname}`;
    await sendWeb(res, plainError(405, "METHOD_NOT_ALLOWED", message));
    return;
  }
  await sendWeb(res, await handler(await toWebRequest(req, url)));
}

function fail(res: ServerResponse, error: unknown): void {
  const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${detail}\n`);
  if (res.destroyed) return;
  if (res.headersSent) {
    res.destroy();
    return;
  }
  res.statusCode = 500;
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      error: { code: "INTERNAL", message: "The server could not complete the request." },
    }),
  );
}

createServer((req, res) => {
  respond(req, res).catch((error: unknown) => {
    fail(res, error);
  });
}).listen(PORT, HOST, () => {
  process.stdout.write(`Vect API listening on http://${HOST}:${String(PORT)}\n`);
});
