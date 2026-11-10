import type { ApiError } from "../contract/api.schema.js";
import type { ApiErrorCode } from "../contract/codes.js";

export class HttpFailure extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly retryable: boolean;
  readonly suggestion: string | null;

  constructor(
    status: number,
    code: ApiErrorCode,
    retryable: boolean,
    suggestion: string | null,
    message: string,
  ) {
    super(message);
    this.name = "HttpFailure";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.suggestion = suggestion;
  }
}

export function errorResponse(failure: HttpFailure, requestId: string): Response {
  const body: ApiError = {
    error: {
      code: failure.code,
      message: failure.message,
      retryable: failure.retryable,
      suggestion: failure.suggestion,
      requestId,
    },
  };
  return Response.json(body, { status: failure.status });
}

export function newRequestId(): string {
  return crypto.randomUUID();
}

export function clientIp(request: Request): string {
  const header = request.headers.get("x-forwarded-for");
  if (header === null) return "local";
  const first = header.split(",")[0]?.trim() ?? "";
  return first === "" ? "local" : first;
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  if (declaredLength(request) > maxBytes) {
    throw new HttpFailure(400, "INVALID_REQUEST", false, null, "The request body is too large.");
  }
  const bytes = await readBounded(request, maxBytes);
  try {
    return jsonValue(new TextDecoder().decode(bytes));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new HttpFailure(400, "INVALID_REQUEST", false, null, "The request body is not JSON.");
    }
    throw error;
  }
}

function declaredLength(request: Request): number {
  const header = request.headers.get("content-length");
  if (header === null) return 0;
  const length = Number(header);
  return Number.isInteger(length) && length >= 0 ? length : maxUnsafeLength;
}

const maxUnsafeLength = Number.MAX_SAFE_INTEGER;

async function readBounded(request: Request, maxBytes: number): Promise<Uint8Array> {
  const body = request.body;
  if (body === null) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let released = false;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        released = true;
        throw new HttpFailure(
          400,
          "INVALID_REQUEST",
          false,
          null,
          "The request body is too large.",
        );
      }
      chunks.push(next.value);
    }
  } finally {
    if (!released) reader.releaseLock();
  }
  return concatBytes(chunks);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function jsonValue(text: string): unknown {
  return JSON.parse(text) as unknown;
}
