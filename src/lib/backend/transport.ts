import "server-only";

export class BackendConfigurationError extends Error {}

export function getBackendUrl(): string {
  const configured = process.env.BACKEND_API_URL?.trim();
  if (!configured && process.env.NODE_ENV === "production")
    throw new BackendConfigurationError(
      "BACKEND_API_URL is required in production.",
    );
  return (configured || "http://localhost:8080").replace(/\/$/, "");
}

// Credentials are supplied by the caller; this transport never reads cookies.
export async function backendFetch(
  path: string,
  init: RequestInit = {},
  token: string | null = null,
  accept = "application/json",
): Promise<Response> {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
    throw new Error("A relative backend path is required.");
  const baseUrl = getBackendUrl();
  const headers = new Headers(init.headers);
  headers.set("Accept", accept);
  headers.delete("Authorization");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(10000),
    redirect: "error",
  });
}
