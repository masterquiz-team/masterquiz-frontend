import "server-only";

import { backendFetch } from "@/lib/backend/transport";
import { isRecord } from "@/lib/validation";
import { authJson } from "./request";
import { getSessionState, readTokenSession, setSessionCookie } from "./session";

export async function ensureGuestSession() {
  try {
    const state = await getSessionState();
    // Never replace an existing user or guest session just to start playing.
    if (state.status === "authenticated" || state.status === "guest")
      return authJson(state);
    if (state.status === "unavailable")
      return authJson(
        { message: "Unable to verify your session. Please try again." },
        503,
      );

    const response = await backendFetch("/guest", { method: "POST" });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok)
      return authJson(
        {
          message:
            "Guest play could not be started. Please try again or log in.",
        },
        response.status,
      );
    const guest = isRecord(result) ? result.guestUserDto : null;
    const token =
      isRecord(result) && typeof result.token === "string"
        ? result.token
        : null;
    const session = token ? readTokenSession(token, "guest") : null;
    if (
      !isRecord(guest) ||
      !Number.isSafeInteger(guest.id) ||
      (guest.id as number) <= 0 ||
      typeof guest.nickname !== "string" ||
      !guest.nickname.trim() ||
      typeof guest.avatar !== "string" ||
      !guest.avatar ||
      !Number.isSafeInteger(guest.score) ||
      (guest.score as number) < 0 ||
      !Number.isSafeInteger(guest.totalGamesPlayed) ||
      (guest.totalGamesPlayed as number) < 0 ||
      !token ||
      session?.kind !== "guest" ||
      session.nickname !== guest.nickname
    )
      return authJson(
        { message: "The API returned an invalid guest session." },
        502,
      );
    const reply = authJson({ status: "guest", session }, 201);
    setSessionCookie(reply, token, session);
    return reply;
  } catch {
    return authJson(
      { message: "Guest play is unavailable. Please try again or log in." },
      502,
    );
  }
}
