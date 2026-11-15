import { ensureGuestSession } from "@/features/auth/server/guest";
import { checkAuthRequest } from "@/features/auth/server/request";

export async function POST(request: Request) {
  const rejected = checkAuthRequest(request);
  return rejected ?? ensureGuestSession();
}
