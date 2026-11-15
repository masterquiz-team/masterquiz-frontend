import "server-only";

import { getPageSession } from "./page-session";

type SessionLinks = { href: string; loginHref: string };

export type ProtectedPageResult<T> =
  | ({ status: "ok"; data: T } & SessionLinks)
  | ({ status: "anonymous" } & SessionLinks)
  | ({ status: "guest" } & SessionLinks)
  | ({ status: "unavailable" } & SessionLinks)
  // Links are present only when the failure happened after the session check.
  | ({ status: "error"; cause: unknown } & Partial<SessionLinks>);

// Runs `load` behind the page session check. `resolveHref` parses the request
// and returns the page's own href (used for login `next` and retry links); it
// and `load` may throw, which is reported as an "error" result.
export async function loadProtectedPage<T>(
  resolveHref: () => string | Promise<string>,
  load: () => Promise<T>,
  { allowGuest = false }: { allowGuest?: boolean } = {},
): Promise<ProtectedPageResult<T>> {
  let links: SessionLinks | undefined;
  try {
    const href = await resolveHref();
    const session = await getPageSession(href);
    links = { href, loginHref: session.loginHref };
    if (session.status === "anonymous")
      return { status: "anonymous", ...links };
    if (session.status === "unavailable")
      return { status: "unavailable", ...links };
    if (session.status === "guest" && !allowGuest)
      return { status: "guest", ...links };
    return { status: "ok", data: await load(), ...links };
  } catch (cause) {
    return { status: "error", cause, ...links };
  }
}
