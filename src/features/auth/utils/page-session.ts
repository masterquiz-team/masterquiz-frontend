import type { AuthSessionState } from "../types";
import { getSafeRedirect } from "./redirect";

export type PageSession = AuthSessionState & { loginHref: string };

export function getLoginHref(nextHref: string): string {
  return `/login?${new URLSearchParams({ next: getSafeRedirect(nextHref) })}`;
}

// Keep this transformation independent of request APIs for reuse and testing.
export function toPageSession(
  state: AuthSessionState,
  nextHref: string,
): PageSession {
  return { ...state, loginHref: getLoginHref(nextHref) };
}
