import { isRecord } from "@/lib/validation";
import type { Account } from "./types";

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export function parseAccount(value: unknown): Account {
  if (
    !isRecord(value) ||
    typeof value.email !== "string" ||
    typeof value.nickname !== "string" ||
    !isCount(value.score) ||
    !isCount(value.totalGamesPlayed) ||
    !isCount(value.level) ||
    value.level < 1 ||
    value.level > 10 ||
    !(
      value.avatar === null ||
      (isCount(value.avatar) && value.avatar >= 1 && value.avatar <= 20)
    ) ||
    !isCount(value.streak)
  )
    throw new Error("Unexpected account response");
  return {
    email: value.email,
    nickname: value.nickname,
    score: value.score,
    totalGamesPlayed: value.totalGamesPlayed,
    level: value.level,
    avatar: value.avatar,
    streak: value.streak,
  };
}
