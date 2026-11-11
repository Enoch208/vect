import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";

type Handler = (request: Request) => Response | Promise<Response>;

const apiRoot = resolve(import.meta.dirname, "api");

function handlerFile(pathname: string): string | null {
  const route = pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  if (!/^[a-z0-9/-]+$/.test(route)) return null;
  const file = resolve(apiRoot, `${route}.ts`);
  return file.startsWith(apiRoot) && existsSync(file) ? file : null;
}

async function readBody(req: IncomingMessage): Promise<Uint8Array<ArrayBuffer> | null> {
  if (req.method === "GET" || req.method === "HEAD") return null;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk as Uint8Array));
  return chunks.length > 0 ? new Uint8Array(Buffer.concat(chunks)) : null;
}

function headersOf(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    if (Array.isArray(value)) headers.set(key, value.join(", "));
  }
  return headers;
}

async function send(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}

function plainError(status: number, message: string): Response {
  return Response.json({ error: { code: "DEV_ROUTER", message } }, { status });
}

async function route(server: ViteDevServer, req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const file = handlerFile(url.pathname);
  if (file === null) {
    await send(res, plainError(404, `No handler for ${url.pathname}`));
    return;
  }
  const module = (await server.ssrLoadModule(file)) as Record<string, unknown>;
  const handler = module[req.method ?? "GET"];
  if (typeof handler !== "function") {
    await send(res, plainError(405, `${req.method ?? "GET"} is not handled by ${url.pathname}`));
    return;
  }
  const body = await readBody(req);
  const request = new Request(url, {
    method: req.method ?? "GET",
    headers: headersOf(req),
    body,
  });
  await send(res, await (handler as Handler)(request));
}

export function apiDevServer(): Plugin {
  return {
    name: "vect-api-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) {
          next();
          return;
        }
        route(server, req, res).catch((error: unknown) => {
          if (req.destroyed || res.destroyed) return;
          if (error instanceof Error) server.ssrFixStacktrace(error);
          next(error);
        });
      });
    },
  };
}
