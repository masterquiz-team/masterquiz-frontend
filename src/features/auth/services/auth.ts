import "client-only";

import type { AuthFormMode, AuthSubmitResult, AuthValues } from "../types";
import { isRecord } from "@/lib/validation";
import { clearSavedAttempts } from "@/lib/attempt-storage";
import {
  isAuthSession,
  isRegisteredUser,
  parseAuthError,
} from "../validators/responses";

async function postAuth(
  action: AuthFormMode | "logout" | "guest",
  body: unknown,
) {
  return fetch(`/api/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
}

export async function submitAuth(
  mode: AuthFormMode,
  payload: AuthValues,
): Promise<AuthSubmitResult> {
  const response = await postAuth(mode, payload);
  const result: unknown = await response.json().catch(() => null);
  if (!isRecord(result)) throw new Error("Unexpected authentication response");

  if (!response.ok) {
    return {
      ok: false,
      error: parseAuthError(
        result,
        "The request could not be completed. Please try again.",
      ),
    };
  }

  const valid =
    mode === "register"
      ? isRegisteredUser(result.user)
      : isAuthSession(result.session) && result.session.kind === "user";
  if (!valid) throw new Error("Unexpected authentication response");
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
    const response = await postAuth("guest", {});
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok || !isRecord(result) || !isAuthSession(result.session))
      throw new Error(
        parseAuthError(result, "Unable to start guest play. Please try again.")
          .message,
      );
    // 200 reuses the current identity; only 201 creates a new guest session.
    if (response.status === 201) clearSavedAttempts();
  })().finally(() => {
    guestRequest = null;
  });
  return guestRequest;
}

export async function logout(): Promise<void> {
  const response = await postAuth("logout", {});
  if (!response.ok) throw new Error("Logout failed");
  clearSavedAttempts();
}
