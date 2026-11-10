import type { z } from "zod";
import {
  apiErrorSchema,
  apiRoutes,
  editRequestSchema,
  editResponseSchema,
  generateRequestSchema,
  generateResponseSchema,
  healthResponseSchema,
  repairRequestSchema,
  repairResponseSchema,
  type EditRequest,
  type GenerateRequest,
  type RepairRequest,
} from "../contract/api.schema.js";
import type { ApiErrorCode } from "../contract/codes.js";

export type ClientFailure = {
  code: ApiErrorCode | "NETWORK" | "BAD_RESPONSE" | "ABORTED";
  message: string;
  retryable: boolean;
  suggestion: string | null;
  status: number | null;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; failure: ClientFailure };

function failure(
  code: ClientFailure["code"],
  message: string,
  retryable: boolean,
  status: number | null = null,
): { ok: false; failure: ClientFailure } {
  return { ok: false, failure: { code, message, retryable, suggestion: null, status } };
}

function aborted() {
  return failure("ABORTED", "A newer request replaced this request.", false);
}

function badResponse(status: number) {
  return failure(
    "BAD_RESPONSE",
    "The service returned an unreadable response. Try again.",
    true,
    status,
  );
}

async function readResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
  signal: AbortSignal,
): Promise<ApiResult<T>> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return signal.aborted ? aborted() : badResponse(response.status);
  }
  if (signal.aborted) return aborted();
  if (response.ok) {
    const parsed = schema.safeParse(body);
    return parsed.success ? { ok: true, data: parsed.data } : badResponse(response.status);
  }
  const parsed = apiErrorSchema.safeParse(body);
  if (!parsed.success) return badResponse(response.status);
  const { code, message, retryable, suggestion } = parsed.data.error;
  return {
    ok: false,
    failure: { code, message, retryable, suggestion, status: response.status },
  };
}

export function createApiClient(fetchImpl: typeof fetch) {
  const inFlight = new Map<string, AbortController>();

  async function request<T>(
    route: string,
    responseSchema: z.ZodType<T>,
    payload?: { schema: z.ZodType; data: unknown },
  ): Promise<ApiResult<T>> {
    const parsed = payload?.schema.safeParse(payload.data);
    if (parsed && !parsed.success) {
      return failure("INVALID_REQUEST", "Check the request fields and try again.", false);
    }
    inFlight.get(route)?.abort();
    const controller = new AbortController();
    inFlight.set(route, controller);
    const init: RequestInit = {
      method: payload ? "POST" : "GET",
      headers: payload
        ? { Accept: "application/json", "Content-Type": "application/json" }
        : { Accept: "application/json" },
      signal: controller.signal,
    };
    if (parsed?.success) init.body = JSON.stringify(parsed.data);
    try {
      const response = await fetchImpl(route, init);
      if (controller.signal.aborted) return aborted();
      return await readResponse(response, responseSchema, controller.signal);
    } catch {
      return controller.signal.aborted
        ? aborted()
        : failure("NETWORK", "Could not reach the service. Check your connection and retry.", true);
    } finally {
      if (inFlight.get(route) === controller) inFlight.delete(route);
    }
  }

  return {
    generate: (data: GenerateRequest) =>
      request(apiRoutes.generate, generateResponseSchema, { schema: generateRequestSchema, data }),
    edit: (data: EditRequest) =>
      request(apiRoutes.edit, editResponseSchema, { schema: editRequestSchema, data }),
    repair: (data: RepairRequest) =>
      request(apiRoutes.repair, repairResponseSchema, { schema: repairRequestSchema, data }),
    health: () => request(apiRoutes.health, healthResponseSchema),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
