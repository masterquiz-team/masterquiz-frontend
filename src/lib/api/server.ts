import "server-only";

import type { NextResponse } from "next/server";
import { backendFetch, BackendConfigurationError } from "../backend/transport";
import { getSessionToken, isGuestToken } from "../backend/token";

import { ApiError, GuestAccessError } from "./errors";
import { isRecord } from "../validation";
import { checkMutationRequest } from "./request";
import { jsonResponse } from "./response";
import { getSessionState } from "../backend/session";

export { ApiError, invalidContract } from "./errors";
export {
  isRecord,
  isId,
  parseId,
  parsePage,
  requireId,
  requireExactKeys,
} from "../validation";

// Read the token once; the shared transport owns timeout and cache policy.
// A backend 403 is preserved: currently it can also indicate controller bugs.
export async function backendRequest<T>(
  path: string,
  parse: (value: unknown) => T,
  init?: RequestInit,
): Promise<T> {
  const token = await getSessionToken();
  if (!token) throw new ApiError(401, "Please log in to continue.");
  let response: Response;
  try {
    response = await backendFetch(path, init, token);
  } catch (error) {
    if (error instanceof BackendConfigurationError) throw error;
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
    if (
      (response.status === 403 || response.status === 401) &&
      (await isGuestToken(token)) &&
      // The backend's protected error dispatch can mask a role denial as 401.
      // A guest-allowed probe must still validate the token before remapping it.
      (response.status === 403 || (await getSessionState()).status === "guest")
    )
      throw new GuestAccessError();
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

function assertSameOrigin(request: Request): void {
  const rejected = checkMutationRequest(request);
  if (rejected)
    throw new ApiError(
      rejected,
      rejected === 415
        ? "Content-Type must be application/json."
        : "This request must come from the same origin.",
    );
}

export async function apiResponse(
  work: () => Promise<unknown>,
  status = 200,
  context = "apiResponse",
): Promise<NextResponse> {
  try {
    return jsonResponse(await work(), status);
  } catch (error) {
    if (error instanceof ApiError)
      return jsonResponse(
        {
          message: error.message,
          ...(error.code ? { code: error.code } : {}),
          ...(error.errors ? { errors: error.errors } : {}),
        },
        error.status,
      );
    console.error(`[${context}] Unexpected request failure`, error);
    return jsonResponse(
      { message: "The request could not be completed." },
      500,
    );
  }
}
