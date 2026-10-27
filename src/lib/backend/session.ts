import "server-only";

import { backendFetch, BackendConfigurationError } from "./transport";
import { getSessionToken, isGuestToken, readTokenClaims } from "./token";
import { cache } from "react";

export type UserSession = {
  kind: "user";
  email: string;
  expiresAt: string;
};

export type GuestSession = {
  kind: "guest";
  nickname: string;
  expiresAt: string;
};

export type AuthSession = UserSession | GuestSession;

export type AuthSessionState =
  | { status: "anonymous"; session: null }
  | { status: "authenticated"; session: UserSession }
  | { status: "guest"; session: GuestSession }
  | { status: "unavailable"; session: null };

// Claim decoding does not verify the signature; getSessionState asks Java.
export function readTokenSession(
  token: string,
  kind: AuthSession["kind"] = "user",
): AuthSession | null {
  const claims = readTokenClaims(token);
  if (!claims) return null;
  return kind === "guest"
    ? { kind, nickname: claims.subject, expiresAt: claims.expiresAt }
    : { kind, email: claims.subject, expiresAt: claims.expiresAt };
}

export const getSessionState = cache(async (): Promise<AuthSessionState> => {
  const token = await getSessionToken();
  if (!token) return { status: "anonymous", session: null };
  const guest = await isGuestToken(token);

  // There is no /me endpoint. Guests use /quiz-attempts/0 instead of
  // /categories for historical reasons (categories used to be denied to
  // guests). The probe still works: attempt reads authenticate before looking
  // up the ID, and 0 cannot be a persisted attempt, so 404 verifies the JWT
  // without creating an attempt or reading user data.
  try {
    const response = await backendFetch(
      guest ? "/quiz-attempts/0" : "/categories?page=0&size=1",
      {},
      token,
    );

    if (response.status === 401) return { status: "anonymous", session: null };
    if (!response.ok && !(guest && response.status === 404))
      return { status: "unavailable", session: null };
    const session = readTokenSession(token, guest ? "guest" : "user");
    if (!session) return { status: "anonymous", session: null };
    return session.kind === "guest"
      ? { status: "guest", session }
      : { status: "authenticated", session };
  } catch (error) {
    if (error instanceof BackendConfigurationError) throw error;
    return { status: "unavailable", session: null };
  }
});

// The backend answers unhandled database errors (for example a foreign key
// that blocks a delete) with 401, because its error page requires login.
// A 401 is a real logout only when the token no longer verifies.
export async function isSessionStillValid() {
  const state = await getSessionState();
  return state.status === "authenticated" || state.status === "guest";
}
