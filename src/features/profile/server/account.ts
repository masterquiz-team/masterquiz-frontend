import "server-only";
import {
  ApiError,
  backendRequest,
  invalidContract,
  isRecord,
  jsonBody,
} from "@/lib/api/server";
import { getSessionToken, isGuestToken } from "@/lib/backend/token";
import {
  isSessionStillValid,
  readTokenSession,
} from "@/features/auth/server/session";
import type { Account } from "../types";

function parseAccount(value: unknown): Account {
  if (
    !isRecord(value) ||
    typeof value.email !== "string" ||
    typeof value.nickname !== "string" ||
    !Number.isSafeInteger(value.score) ||
    (value.score as number) < 0
  )
    invalidContract();
  // The backend user ID is not exposed to the browser.
  return {
    email: value.email,
    nickname: value.nickname,
    score: value.score as number,
  };
}

// Upstream messages can name internal entities; keep only the status.
async function accountRequest<T>(
  path: string,
  parse: (value: unknown) => T,
  init?: RequestInit,
  refusedMessage = "The account service could not complete this request. Please try again.",
) {
  try {
    return await backendRequest(path, parse, init);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401 && (await isSessionStillValid()))
      throw new ApiError(409, refusedMessage);
    throw new ApiError(
      error.status,
      error.status === 401
        ? "Please log in to continue."
        : error.status === 400
          ? "Check your username and try again."
          : error.status === 403
            ? "This account change was denied. Your session has been kept."
            : error.status === 404
              ? "This account no longer exists."
              : "The account service could not complete this request. Please try again.",
    );
  }
}

export function getAccount() {
  return accountRequest("/user-profile", parseAccount);
}

// The backend checks that the email in the body matches the token subject.
export async function updateNickname(nickname: string) {
  const token = await getSessionToken();
  if (token && (await isGuestToken(token)))
    throw new ApiError(403, "Register to manage your profile.");
  const session = token ? readTokenSession(token) : null;
  if (!session || session.kind !== "user")
    throw new ApiError(401, "Please log in to continue.");
  return accountRequest(
    "/user-profile",
    parseAccount,
    jsonBody("PUT", { email: session.email, nickname }),
  );
}

export function deleteAccount() {
  return accountRequest(
    "/user-profile",
    () => null,
    { method: "DELETE" },
    // The backend cannot delete a user who has quiz attempts yet.
    "Accounts with quiz history cannot be deleted yet. Your session has been kept.",
  );
}
