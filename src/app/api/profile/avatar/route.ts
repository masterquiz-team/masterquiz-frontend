import { getAvatarResponse } from "@/features/profile/server/avatar";

export async function GET(request: Request) {
  return getAvatarResponse(new URL(request.url).searchParams);
}
