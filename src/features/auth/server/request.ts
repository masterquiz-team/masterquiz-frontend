import "server-only";

import { NextResponse } from "next/server";

export const AUTH_RESPONSE_HEADERS = { "Cache-Control": "no-store" };

export function authJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: AUTH_RESPONSE_HEADERS });
}

// Cookie authentication needs protection against cross-origin mutations,
// including login CSRF. Browser JSON requests have an Origin header; callers
// without browser metadata (for example curl) must still send JSON.
export function checkAuthRequest(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    site === "cross-site" ||
    site === "same-site"
  ) {
    return authJson({ message: "The request origin was not accepted." }, 403);
  }

  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return authJson({ message: "Send the request as JSON." }, 415);
  }

  return null;
}
