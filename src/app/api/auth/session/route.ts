import { authJson } from "@/features/auth/server/request";
import { getSessionState } from "@/lib/backend/session";
import { clearSessionCookie } from "@/features/auth/server/session";

export async function GET() {
  try {
    const state = await getSessionState();
    if (state.status === "unavailable")
      return authJson(
        {
          status: state.status,
          message: "Unable to verify your session. Please try again.",
        },
        503,
      );
    const response = authJson(state);
    if (state.status === "anonymous") clearSessionCookie(response);
    return response;
  } catch {
    // A temporary backend outage is not a logout. Preserve the cookie so the
    // user can retry without losing a valid session.
    return authJson(
      {
        status: "unavailable",
        message: "Unable to verify your session. Please try again.",
      },
      503,
    );
  }
}
