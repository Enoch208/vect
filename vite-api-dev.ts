import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { plainError, sendWeb, toWebRequest } from "./node-bridge.js";

type Handler = (request: Request) => Response | Promise<Response>;

const apiRoot = resolve(import.meta.dirname, "api");

function handlerFile(pathname: string): string | null {
  const route = pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  if (!/^[a-z0-9/-]+$/.test(route)) return null;
  const file = resolve(apiRoot, `${route}.ts`);
  return file.startsWith(apiRoot) && existsSync(file) ? file : null;
}

async function route(server: ViteDevServer, req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const file = handlerFile(url.pathname);
  if (file === null) {
    await sendWeb(res, plainError(404, "DEV_ROUTER", `No handler for ${url.pathname}`));
    return;
  }
  const module = (await server.ssrLoadModule(file)) as Record<string, unknown>;
  const handler = module[req.method ?? "GET"];
  if (typeof handler !== "function") {
    const message = `${req.method ?? "GET"} is not handled by ${url.pathname}`;
    await sendWeb(res, plainError(405, "DEV_ROUTER", message));
    return;
  }
  await sendWeb(res, await (handler as Handler)(await toWebRequest(req, url)));
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
