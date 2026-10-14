import "server-only";

import { cookies } from "next/headers";
import { isRecord } from "../validation";

export const SESSION_COOKIE = "masterquiz_session";

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
