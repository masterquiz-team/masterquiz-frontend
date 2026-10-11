import "client-only";

import type { AuthFormMode, AuthSubmitResult, AuthValues } from "../types";
import {
  isAuthSession,
  isRecord,
  isRegisteredUser,
  parseAuthError,
} from "../validators/responses";

async function postAuth(action: AuthFormMode | "logout", body: unknown) {
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
      : isAuthSession(result.session);
  if (!valid) throw new Error("Unexpected authentication response");
  return { ok: true };
}

export async function logout(): Promise<void> {
  const response = await postAuth("logout", {});
  if (!response.ok) throw new Error("Logout failed");
}
