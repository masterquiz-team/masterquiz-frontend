import "server-only";

import type { NextResponse } from "next/server";
import type { AuthSession } from "@/lib/backend/session-types";
import {
  guestTokenMarker,
  GUEST_COOKIE,
  SESSION_COOKIE,
} from "@/lib/backend/token";

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
  response.cookies.set(
    GUEST_COOKIE,
    session.kind === "guest" ? guestTokenMarker(token) : "",
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(session.kind === "guest"
        ? { expires: new Date(session.expiresAt) }
        : { maxAge: 0 }),
    },
  );
}

export function clearSessionCookie(response: NextResponse) {
  for (const name of [SESSION_COOKIE, GUEST_COOKIE])
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
}
