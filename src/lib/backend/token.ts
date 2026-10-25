import "server-only";

import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { isRecord } from "../validation";

export const SESSION_COOKIE = "masterquiz_session";
export const GUEST_COOKIE = "masterquiz_guest";

// Bind the marker to this JWT so it cannot survive a session replacement.
export function guestTokenMarker(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function isGuestToken(token: string): Promise<boolean> {
  return (await cookies()).get(GUEST_COOKIE)?.value === guestTokenMarker(token);
}

// This only checks claims/expiry. The backend must verify the JWT signature.
export function readTokenClaims(
  token: string,
): { subject: string; expiresAt: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const claims: unknown = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    if (
      !isRecord(claims) ||
      typeof claims.sub !== "string" ||
      !claims.sub ||
      typeof claims.exp !== "number" ||
      !Number.isFinite(claims.exp) ||
      claims.exp * 1000 <= Date.now()
    )
      return null;
    return {
      subject: claims.sub,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getSessionToken(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token && readTokenClaims(token) ? token : null;
}
