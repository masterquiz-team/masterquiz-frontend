import "server-only";

import { backendFetch } from "@/features/auth/server/backend";
import { getSessionToken } from "@/features/auth/server/session";
import { checkAuthRequest } from "@/features/auth/server/request";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: string[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function parseId(value: string): number {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !isId(id)) {
    throw new ApiError(400, "A positive integer identifier is required.");
  }
  return id;
}

export function parsePage(value: string | undefined): number {
  if (value === undefined) return 0;
  const page = Number(value);
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(page) ||
    page > 2147483647
  ) {
    throw new ApiError(400, "Page must be a non-negative integer.");
  }
  return page;
}

export function requireText(
  value: unknown,
  name: string,
  min: number,
  max: number,
): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length < min ||
    value.length > max
  ) {
    throw new ApiError(400, `${name} must contain ${min}–${max} characters.`);
  }
  return value;
}

export function requireId(value: unknown, name = "id"): number {
  if (!isId(value))
    throw new ApiError(400, `${name} must be a positive integer.`);
  return value;
}

export function requireBoolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean")
    throw new ApiError(400, `${name} must be a boolean.`);
  return value;
}

export function invalidContract(): never {
  throw new ApiError(502, "The backend returned an unexpected response.");
}

// The shared auth transport owns JWT forwarding, timeout and cache policy.
// A backend 403 is preserved: currently it can also indicate controller bugs.
export async function backendRequest<T>(
  path: string,
  parse: (value: unknown) => T,
  init?: RequestInit,
): Promise<T> {
  if (!(await getSessionToken()))
    throw new ApiError(401, "Please log in to continue.");
  let response: Response;
  try {
    response = await backendFetch(path, init);
  } catch (error) {
    const timeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    throw new ApiError(
      timeout ? 504 : 502,
      "The backend is unavailable. Please try again.",
    );
  }
  let value: unknown;
  try {
    value = response.status === 204 ? null : await response.json();
  } catch {
    value = null;
  }
  if (!response.ok) {
    const message =
      isRecord(value) && typeof value.message === "string"
        ? value.message
        : "The backend could not complete this request.";
    throw new ApiError(
      response.status >= 300 && response.status < 400 ? 502 : response.status,
      message,
      isRecord(value) && Array.isArray(value.errors)
        ? value.errors.filter(
            (item): item is string => typeof item === "string",
          )
        : undefined,
    );
  }
  return parse(value);
}

export const jsonBody = (
  method: "POST" | "PUT",
  body: unknown,
): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function deleteBackend(path: string): Promise<void> {
  await backendRequest(
    path,
    (value) => {
      if (value !== null) invalidContract();
    },
    { method: "DELETE" },
  );
}

export async function readMutation(
  request: Request,
): Promise<Record<string, unknown>> {
  assertSameOrigin(request);
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError(400, "A JSON object is required.");
  }
  if (!isRecord(value)) throw new ApiError(400, "A JSON object is required.");
  return value;
}

export function assertSameOrigin(request: Request): void {
  const rejected = checkAuthRequest(request);
  if (rejected)
    throw new ApiError(
      rejected.status,
      rejected.status === 415
        ? "Content-Type must be application/json."
        : "This request must come from the same origin.",
    );
}

export async function apiResponse(
  work: () => Promise<unknown>,
  status = 200,
): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  try {
    const result = await work();
    return status === 204
      ? new Response(null, { status, headers })
      : Response.json(result, { status, headers });
  } catch (error) {
    if (error instanceof ApiError)
      return Response.json(
        {
          message: error.message,
          ...(error.errors ? { errors: error.errors } : {}),
        },
        { status: error.status, headers },
      );
    return Response.json(
      { message: "The request could not be completed." },
      { status: 500, headers },
    );
  }
}
