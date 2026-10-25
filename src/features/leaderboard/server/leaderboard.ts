import "server-only";
import {
  ApiError,
  backendRequest,
  invalidContract,
  isRecord,
} from "@/lib/api/server";
import { parseSpringPage } from "@/lib/validation";
import { isSessionStillValid } from "@/features/auth/server/session";
import type { Leaderboard, LeaderboardEntry, LeaderboardMe } from "../types";

const isCount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

function parseEntry(value: unknown, category: boolean): LeaderboardEntry {
  if (
    !isRecord(value) ||
    !isCount(value.userId) ||
    !isCount(value.rank) ||
    value.rank < 1 ||
    typeof value.nickname !== "string" ||
    typeof value.flag !== "boolean" ||
    (category && typeof value.categoryName !== "string")
  )
    invalidContract();
  const score = category ? value.categoryScore : value.score;
  const gamesPlayed = category ? value.gamesPlayed : value.totalGamesPlayed;
  if (!isCount(score) || !isCount(gamesPlayed)) invalidContract();
  return {
    rank: value.rank,
    nickname: value.nickname,
    score,
    gamesPlayed,
    currentUser: value.flag === true,
  };
}

function parseMe(value: unknown): LeaderboardMe {
  if (
    !isRecord(value) ||
    typeof value.nickname !== "string" ||
    !isCount(value.totalScore) ||
    !isCount(value.totalGamesPlayed) ||
    !isCount(value.rank) ||
    !isRecord(value.scoreByCategoryId) ||
    typeof value.flag !== "boolean"
  )
    invalidContract();
  const scoreByCategoryId = Object.fromEntries(
    Object.entries(value.scoreByCategoryId).map(([id, score]) => {
      if (!isCount(score)) invalidContract();
      return [id, score];
    }),
  );
  return {
    nickname: value.nickname,
    totalScore: value.totalScore,
    totalGamesPlayed: value.totalGamesPlayed,
    rank: value.rank,
    scoreByCategoryId,
    flag: value.flag,
  };
}

export async function getLeaderboard(
  categoryId: number | null,
): Promise<Leaderboard> {
  const query = new URLSearchParams({ page: "0", size: "10" });
  const path =
    categoryId === null ? "/leaderboard" : `/leaderboard/${categoryId}`;
  try {
    const [page, me] = await Promise.all([
      backendRequest(`${path}?${query}`, (value) =>
        parseSpringPage(value, (entry) =>
          parseEntry(entry, categoryId !== null),
        ),
      ),
      backendRequest("/leaderboard/me", parseMe).catch(() => null),
    ]);
    return { status: "ok", entries: page.content, me };
  } catch (error) {
    // Spring can mask server errors as 401 because /error requires login.
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      !(await isSessionStillValid())
    )
      throw error;
    return { status: "error" };
  }
}
