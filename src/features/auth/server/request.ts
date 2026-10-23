import "server-only";

import type { NextResponse } from "next/server";
import { checkMutationRequest } from "@/lib/api/request";
import { jsonResponse } from "@/lib/api/response";

export { jsonResponse as authJson } from "@/lib/api/response";

// Preserve auth messages while sharing HTTP validation with other mutations.
export function checkAuthRequest(request: Request): NextResponse | null {
  const status = checkMutationRequest(request);
  return status
    ? jsonResponse(
        {
          message:
            status === 403
              ? "The request origin was not accepted."
              : "Send the request as JSON.",
        },
        status,
      )
    : null;
}
