import "server-only";

// Behind a hosting proxy (e.g. Render) request.url carries the internal
// address, so production sets APP_ORIGIN to the public site URL.
function expectedOrigin(request: Request): string {
  const configured = process.env.APP_ORIGIN?.trim();
  return new URL(configured || request.url).origin;
}

export function checkMutationRequest(request: Request): 403 | 415 | null {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (
    (origin && origin !== expectedOrigin(request)) ||
    site === "cross-site" ||
    site === "same-site"
  )
    return 403;
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return 415;
  return null;
}
