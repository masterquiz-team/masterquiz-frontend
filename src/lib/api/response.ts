import "server-only";

import { NextResponse } from "next/server";

export const RESPONSE_HEADERS = { "Cache-Control": "no-store" };

export function jsonResponse(body: unknown, status = 200): NextResponse {
  return status === 204
    ? new NextResponse(null, { status, headers: RESPONSE_HEADERS })
    : NextResponse.json(body, { status, headers: RESPONSE_HEADERS });
}
