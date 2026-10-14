import "server-only";

export function checkMutationRequest(request: Request): 403 | 415 | null {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (
    (origin && origin !== new URL(request.url).origin) ||
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
