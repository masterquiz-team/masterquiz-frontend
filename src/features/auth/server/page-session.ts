import "server-only";

import { getSessionState } from "@/features/auth/server/session";
import { toPageSession } from "../utils/page-session";

export async function getPageSession(nextHref: string) {
  // Call the existing zero-argument React.cache function so Header and pages
  // share verification within a request, regardless of their nextHref.
  return toPageSession(await getSessionState(), nextHref);
}
