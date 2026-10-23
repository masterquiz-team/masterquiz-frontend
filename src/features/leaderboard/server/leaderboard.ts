import "server-only";
import {
  ApiError,
  backendRequest,
  invalidContract,
  isRecord,
} from "@/lib/api/server";
import { parseSpringPage } from "@/lib/validation";
import type { Leaderboard, LeaderboardEntry, LeaderboardMe } from "../types";

const isCount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

function parseEntry(value: unknown): LeaderboardEntry {
  if (
    !isRecord(value) ||
    !isCount(value.rank) ||
    typeof value.nickname !== "string" ||
    !isCount(value.score) ||
    !isCount(value.gamesPlayed)
  )
    invalidContract();
  return {
    rank: value.rank,
    nickname: value.nickname,
    score: value.score,
    gamesPlayed: value.gamesPlayed,
    currentUser: value.currentUser === true,
  };
}

function parseMe(value: unknown): LeaderboardMe {
  if (!isRecord(value) || !isCount(value.rank) || !isCount(value.score))
    invalidContract();
  return { rank: value.rank, score: value.score };
}

// 404/405/501 mean the endpoint does not exist yet.
const NOT_BUILT = new Set([404, 405, 501]);

export async function getLeaderboard(
  categoryId: number | null,
): Promise<Leaderboard> {
  const query = new URLSearchParams({ page: "0", size: "10" });
  if (categoryId) query.set("categoryId", String(categoryId));
  try {
    const [page, me] = await Promise.all([
      backendRequest(`/leaderboard?${query}`, (value) =>
        parseSpringPage(value, parseEntry),
      ),
      backendRequest(
        `/leaderboard/me${categoryId ? `?categoryId=${categoryId}` : ""}`,
        parseMe,
      ).catch(() => null),
    ]);
    return { status: "ok", entries: page.content, me };
  } catch (error) {
    if (error instanceof ApiError && NOT_BUILT.has(error.status))
      return { status: "pending" };
    if (error instanceof ApiError && error.status === 401) throw error;
    return { status: "error" };
  }
}
