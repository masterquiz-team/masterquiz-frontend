import "server-only";
import {
  ApiError,
  backendRequest,
  invalidContract,
  isRecord,
  jsonBody,
} from "@/lib/api/server";
import { getSessionToken, isGuestToken } from "@/lib/backend/token";
import { isSessionStillValid, readTokenSession } from "@/lib/backend/session";
import type { Account } from "../types";
import { levelFromScore } from "../levels";
import { AVATAR_SAVE_FAILED } from "../avatars";

const countOrZero = (value: unknown): number =>
  Number.isSafeInteger(value) && (value as number) >= 0 ? (value as number) : 0;

// Java only updates streaks on completion, so expire stale streaks here in UTC.
function effectiveStreak(
  streak: unknown,
  lastTimePlayed: unknown,
  now = new Date(),
) {
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000)
    .toISOString()
    .slice(0, 10);
  return lastTimePlayed === today || lastTimePlayed === yesterday
    ? countOrZero(streak)
    : 0;
}

function parseAccount(value: unknown): Account {
  if (
    !isRecord(value) ||
    typeof value.email !== "string" ||
    typeof value.nickname !== "string" ||
    !Number.isSafeInteger(value.score) ||
    (value.score as number) < 0
  )
    invalidContract();
  const parsedLevel =
    typeof value.level === "string"
      ? /^LEVEL_([1-9]|10)$/.exec(value.level)
      : null;
  const parsedAvatar =
    typeof value.avatarId === "string"
      ? /^(?:AVATAR_|avatar-)([1-9]|1[0-9]|20)$/.exec(value.avatarId)
      : null;
  // The profile view leaves out the backend user ID; the browser does not
  // need it here. (The register response still includes it.)
  return {
    email: value.email,
    nickname: value.nickname,
    score: value.score as number,
    totalGamesPlayed: countOrZero(value.totalGamesPlayed),
    level: parsedLevel
      ? Number(parsedLevel[1])
      : levelFromScore(value.score as number),
    avatar: parsedAvatar ? Number(parsedAvatar[1]) : null,
    streak: effectiveStreak(value.streak, value.lastTimePlayed),
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
// Fields left out (the avatar) keep their current value.
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

// Avatar updates omit nickname: Java's mapper preserves omitted fields.
export async function updateAvatar(avatar: number) {
  const token = await getSessionToken();
  if (token && (await isGuestToken(token)))
    throw new ApiError(403, "Register to manage your profile.");
  const session = token ? readTokenSession(token) : null;
  if (!session || session.kind !== "user")
    throw new ApiError(401, "Please log in to continue.");
  try {
    const account = await backendRequest(
      "/user-profile",
      parseAccount,
      jsonBody("PUT", { email: session.email, avatarId: `avatar-${avatar}` }),
    );
    if (account.avatar !== avatar) throw new ApiError(502, AVATAR_SAVE_FAILED);
    return account;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    // Java's error dispatch can return 401 even for an authenticated request.
    if (error.status === 401)
      throw (await isSessionStillValid())
        ? new ApiError(409, AVATAR_SAVE_FAILED)
        : new ApiError(401, "Please log in to continue.");
    if (error.status === 404)
      throw new ApiError(404, "This account no longer exists.");
    throw new ApiError(error.status, AVATAR_SAVE_FAILED);
  }
}
