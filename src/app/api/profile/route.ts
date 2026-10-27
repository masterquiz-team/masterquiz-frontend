import {
  ApiError,
  apiResponse,
  readMutation,
  requireExactKeys,
} from "@/lib/api/server";
import { clearSessionCookie } from "@/features/auth/server/session";
import {
  deleteAccount,
  updateNickname,
} from "@/features/profile/server/account";
import { validateNickname } from "@/lib/nickname";

export function PUT(request: Request) {
  return apiResponse(
    async () => {
      const body = await readMutation(request);
      requireExactKeys(body, ["nickname"], "Only nickname is accepted.");
      if (typeof body.nickname !== "string")
        throw new ApiError(400, "Enter your username.");
      const error = validateNickname(body.nickname);
      if (error) throw new ApiError(400, error);
      return updateNickname(body.nickname.trim());
    },
    200,
    "profile",
  );
}

// Deleting the account also ends the session in this browser.
export async function DELETE(request: Request) {
  const response = await apiResponse(
    async () => {
      const body = await readMutation(request);
      requireExactKeys(body, [], "No parameters are accepted.");
      await deleteAccount();
      return { message: "Your account has been deleted." };
    },
    200,
    "profile",
  );
  if (response.ok) clearSessionCookie(response);
  return response;
}
