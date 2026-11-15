import "client-only";

import { getDifficulty, type Difficulty } from "../difficulty";
import type { PlayerAttempt } from "../types";
import { isGeneratedQuiz } from "../quizzes";
import { ATTEMPT_STORAGE_PREFIX } from "@/lib/attempt-storage";
import {
  apiRequest,
  ApiClientError as GameRequestError,
  GAME_ACTION_TIMEOUT,
} from "@/lib/api/client";
import { parseGameView, parsePlayerAttempt } from "../validators/view";

export { GameRequestError };

const requestOptions = {
  fallbackMessage: "The game could not be loaded. Please try again.",
  networkMessage:
    "The connection was interrupted. Reload saved progress before trying again.",
  timeoutMessage:
    "The request timed out. Reload saved progress before trying again.",
  // Reading play also assembles a context through multiple backend calls.
  timeoutMs: GAME_ACTION_TIMEOUT,
};
// What a start request asks for: a chosen quiz, or a random quiz of a
// category and difficulty.
export type GameStart =
  { quizId: number } | { categoryId: number; difficulty: Difficulty };
export const attemptKey = (start: GameStart) =>
  "quizId" in start
    ? `${ATTEMPT_STORAGE_PREFIX}quiz:${start.quizId}`
    : `${ATTEMPT_STORAGE_PREFIX}${start.categoryId}:${start.difficulty}`;
// Rebuilds the start of a loaded game so resume and Play again use one key.
export const gameStartOf = (game: {
  attempt: { quizId: number };
  category: { id: number };
  difficulty: Difficulty;
  title: string;
}): GameStart =>
  isGeneratedQuiz(game.title)
    ? { categoryId: game.category.id, difficulty: game.difficulty }
    : { quizId: game.attempt.quizId };
export function parseSavedAttemptId(saved: string | null): number | null {
  return saved &&
    /^\d+$/.test(saved) &&
    Number.isSafeInteger(Number(saved)) &&
    Number(saved) > 0
    ? Number(saved)
    : null;
}
export function clearSavedAttempt(attemptId: number) {
  // Collect first: removing keys changes sessionStorage's numeric indexes.
  const keys = Object.keys(sessionStorage).filter(
    (key) =>
      key.startsWith(ATTEMPT_STORAGE_PREFIX) &&
      parseSavedAttemptId(sessionStorage.getItem(key)) === attemptId,
  );
  let target: { categoryId: number; difficulty: Difficulty } | null = null;
  for (const key of keys) {
    const match = /^masterquiz-attempt:(\d+):(easy|medium|hard)$/.exec(key);
    const categoryId = match ? parseSavedAttemptId(match[1]) : null;
    const difficulty = getDifficulty(match?.[2]);
    if (categoryId !== null && difficulty)
      target = { categoryId, difficulty: difficulty.id };
    sessionStorage.removeItem(key);
  }
  return target;
}
export async function startNewGame(start: GameStart): Promise<PlayerAttempt> {
  const key = attemptKey(start);
  // Write before the request: a lost response must not create another attempt on reload.
  sessionStorage.setItem(key, "unknown");
  try {
    const attempt = await apiRequest("/api/quiz-attempts", {
      ...requestOptions,
      method: "POST",
      body: start,
      parse: parsePlayerAttempt,
    });
    sessionStorage.setItem(key, String(attempt.id));
    return attempt;
  } catch (error) {
    if (
      error instanceof GameRequestError &&
      error.status >= 400 &&
      error.status < 500
    )
      sessionStorage.removeItem(key);
    throw error;
  }
}
export const getGame = (id: number, review?: number) =>
  apiRequest(
    `/api/quiz-attempts/${id}/play${review ? `?review=${review}` : ""}`,
    { ...requestOptions, parse: parseGameView },
  );
export const submitGameAnswer = (id: number, answerId: number) =>
  apiRequest(`/api/quiz-attempts/${id}/answers`, {
    ...requestOptions,
    method: "POST",
    body: { answerId },
    parse: parseGameView,
  });
export const finishGame = (id: number) =>
  apiRequest(`/api/quiz-attempts/${id}/finish`, {
    ...requestOptions,
    method: "PUT",
    body: {},
    parse: parseGameView,
  });
