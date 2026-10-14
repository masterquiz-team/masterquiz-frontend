import "server-only";

import {
  backendFetch,
  BackendConfigurationError,
} from "@/lib/backend/transport";
import {
  getSessionToken,
  readTokenClaims,
  SESSION_COOKIE,
} from "@/lib/backend/token";
import { cache } from "react";
import type { NextResponse } from "next/server";
import type { AuthSession, AuthSessionState } from "../types";

export { getSessionToken, SESSION_COOKIE } from "@/lib/backend/token";

// Claim decoding does not verify the signature; getSessionState asks Java.
export function readTokenSession(token: string): AuthSession | null {
  const claims = readTokenClaims(token);
  return claims ? { email: claims.subject, expiresAt: claims.expiresAt } : null;
}

export const getSessionState = cache(async (): Promise<AuthSessionState> => {
  const token = await getSessionToken();
  if (!token) return { status: "anonymous", session: null };

  // The current backend has no /me endpoint. A small, read-only authenticated
  // request verifies the JWT without inventing a user/profile endpoint.
  try {
    const response = await backendFetch("/categories?page=0&size=1", {}, token);

    if (response.status === 401) return { status: "anonymous", session: null };
    // A forbidden resource is not proof that the JWT is invalid. Keep the
    // session cookie and expose verification failures separately from guests.
    if (!response.ok) return { status: "unavailable", session: null };
    const session = readTokenSession(token);
    return session
      ? { status: "authenticated", session }
      : { status: "anonymous", session: null };
  } catch (error) {
    if (error instanceof BackendConfigurationError) throw error;
    return { status: "unavailable", session: null };
  }
});

export async function getSession(): Promise<AuthSession | null> {
  const state = await getSessionState();
  if (state.status === "unavailable")
    throw new Error("The session could not be verified.");
  return state.session;
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  session: AuthSession,
) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
