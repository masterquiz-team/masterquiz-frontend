import "client-only";

import type { AuthFormMode, AuthSubmitResult, AuthValues } from "../types";
import { isRecord } from "@/lib/validation";
import { clearSavedAttempts } from "@/lib/attempt-storage";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import {
  isAuthSession,
  isRegisteredUser,
  parseAuthError,
} from "../validators/responses";

async function postAuth(
  action: AuthFormMode | "logout" | "guest",
  body: unknown,
  fallbackMessage: string,
) {
  return apiRequest(`/api/auth/${action}`, {
    method: "POST",
    body,
    fallbackMessage,
    // Auth validates its two response variants below; guest creation also
    // needs the status to distinguish a new identity from the existing one.
    parse: (result, status) => ({ result, status }),
  });
}

export async function submitAuth(
  mode: AuthFormMode,
  payload: AuthValues,
): Promise<AuthSubmitResult> {
  let result: unknown;
  try {
    ({ result } = await postAuth(
      mode,
      payload,
      "Unexpected authentication response",
    ));
  } catch (cause) {
    if (!(cause instanceof ApiClientError) || cause.status === 0) throw cause;
    if (isRecord(cause.body))
      return {
        ok: false,
        error: parseAuthError(
          cause.body,
          "The request could not be completed. Please try again.",
        ),
      };
    throw new ApiClientError(
      cause.status,
      "Unexpected authentication response",
    );
  }
  if (!isRecord(result))
    throw new ApiClientError(502, "Unexpected authentication response");

  const valid =
    mode === "register"
      ? isRegisteredUser(result.user)
      : isAuthSession(result.session) && result.session.kind === "user";
  if (!valid)
    throw new ApiClientError(502, "Unexpected authentication response");
  clearSavedAttempts();
  return {
    ok: true,
    signedIn: isAuthSession(result.session) && result.session.kind === "user",
  };
}

let guestRequest: Promise<void> | null = null;

export function ensurePlaySession(): Promise<void> {
  if (guestRequest) return guestRequest;
  guestRequest = (async () => {
    const fallback = "Unable to start guest play. Please try again.";
    let response;
    try {
      response = await postAuth("guest", {}, fallback);
    } catch (cause) {
      if (!(cause instanceof ApiClientError) || cause.status === 0) throw cause;
      throw new ApiClientError(
        cause.status,
        parseAuthError(cause.body, fallback).message,
      );
    }
    const { result, status } = response;
    if (!isRecord(result) || !isAuthSession(result.session))
      throw new ApiClientError(
        502,
        parseAuthError(result, "Unable to start guest play. Please try again.")
          .message,
      );
    // 200 reuses the current identity; only 201 creates a new guest session.
    if (status === 201) clearSavedAttempts();
  })().finally(() => {
    guestRequest = null;
  });
  return guestRequest;
}

export async function logout(): Promise<void> {
  try {
    await postAuth("logout", {}, "Logout failed");
  } catch (cause) {
    if (!(cause instanceof ApiClientError) || cause.status === 0) throw cause;
    throw new ApiClientError(cause.status, "Logout failed");
  }
  clearSavedAttempts();
}
