import "server-only";

import { getSessionToken } from "./session";

// Only server code knows the Java API address and sends the bearer token.
export async function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    throw new Error("A relative backend path is required.");
  }

  const baseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080";
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  // A stale session must not prevent the user from logging in again.
  const token =
    path === "/login" || path === "/register" ? null : await getSessionToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(10000),
    redirect: "error",
  });
}
