import { authJson, checkAuthRequest } from "@/features/auth/server/request";
import { clearSessionCookie } from "@/features/auth/server/session";

export async function POST(request: Request) {
  const rejected = checkAuthRequest(request);
  if (rejected) return rejected;

  const response = authJson({ message: "You have been logged out." });
  clearSessionCookie(response);
  return response;
}
