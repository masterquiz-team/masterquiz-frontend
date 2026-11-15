import type { AuthFormMode } from "../types";

export function getSafeRedirect(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  )
    return "/";

  const pathname = new URL(value, "https://masterquiz.invalid").pathname;
  return pathname === "/login" || pathname === "/register" ? "/" : value;
}

export function getAuthSuccessRedirect(
  mode: AuthFormMode,
  redirectTo: string,
): string {
  const next = getSafeRedirect(redirectTo);
  if (mode === "login") return next;

  const query = new URLSearchParams({ registered: "1" });
  if (next !== "/") query.set("next", next);
  return `/login?${query}`;
}
