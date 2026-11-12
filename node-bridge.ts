import type { IncomingMessage, ServerResponse } from "node:http";

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

export async function toWebRequest(req: IncomingMessage, url: URL): Promise<Request> {
  return new Request(url, {
    method: req.method ?? "GET",
    headers: headersOf(req),
    body: await readBody(req),
  });
}

export async function sendWeb(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}

export function plainError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}
