import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import type { NextResponse } from "next/server";
import type { AuthSession, AuthSessionState } from "../types";

export const SESSION_COOKIE = "masterquiz_session";

// Decoding is used only to read the expiry and email. It does NOT verify the
// signature. getSession asks the Java backend to verify the token before it
// returns an authenticated identity.
export function readTokenSession(token: string): AuthSession | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload: unknown = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    if (!payload || typeof payload !== "object") return null;
    const claims = payload as Record<string, unknown>;
    if (
      typeof claims.sub !== "string" ||
      !claims.sub ||
      typeof claims.exp !== "number" ||
      !Number.isFinite(claims.exp) ||
      claims.exp * 1000 <= Date.now()
    ) {
      return null;
    }
    return {
      email: claims.sub,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getSessionToken(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token && readTokenSession(token) ? token : null;
}

export const getSessionState = cache(async (): Promise<AuthSessionState> => {
  const token = await getSessionToken();
  if (!token) return { status: "anonymous", session: null };

  // The current backend has no /me endpoint. A small, read-only authenticated
  // request verifies the JWT without inventing a user/profile endpoint.
  const baseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/categories?page=0&size=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      },
    );

    if (response.status === 401) return { status: "anonymous", session: null };
    // A forbidden resource is not proof that the JWT is invalid. Keep the
    // session cookie and expose verification failures separately from guests.
    if (!response.ok) return { status: "unavailable", session: null };
    const session = readTokenSession(token);
    return session
      ? { status: "authenticated", session }
      : { status: "anonymous", session: null };
  } catch {
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
