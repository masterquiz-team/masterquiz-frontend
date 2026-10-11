import { authJson } from "@/features/auth/server/request";
import { clearSessionCookie, getSession } from "@/features/auth/server/session";

export async function GET() {
  try {
    const session = await getSession();
    const response = authJson({ session });
    if (!session) clearSessionCookie(response);
    return response;
  } catch {
    // A temporary backend outage is not a logout. Preserve the cookie so the
    // user can retry without losing a valid session.
    return authJson(
      { message: "Unable to verify your session. Please try again." },
      503,
    );
  }
}
