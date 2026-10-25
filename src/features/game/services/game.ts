import type { Difficulty } from "../difficulty";
import type { GameView, PlayerAttempt } from "../types";
import { isGeneratedQuiz } from "../quizzes";

export class GameRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export async function gameRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      cache: "no-store",
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
  } catch {
    throw new GameRequestError(
      0,
      "The connection was interrupted. Reload saved progress before trying again.",
    );
  }
  const value = await response.json().catch(() => null);
  if (!response.ok || value === null)
    throw new GameRequestError(
      response.ok ? 502 : response.status,
      typeof value?.message === "string"
        ? value.message
        : "The game could not be loaded. Please try again.",
      typeof value?.code === "string" ? value.code : undefined,
    );
  return value as T;
}
// What a start request asks for: a chosen quiz, or a random quiz of a
// category and difficulty.
export type GameStart =
  { quizId: number } | { categoryId: number; difficulty: Difficulty };
export const attemptKey = (start: GameStart) =>
  "quizId" in start
    ? `masterquiz-attempt:quiz:${start.quizId}`
    : `masterquiz-attempt:${start.categoryId}:${start.difficulty}`;
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
export async function startNewGame(start: GameStart): Promise<PlayerAttempt> {
  const key = attemptKey(start);
  // Write before the request: a lost response must not create another attempt on reload.
  sessionStorage.setItem(key, "unknown");
  try {
    const attempt = await gameRequest<PlayerAttempt>(
      "/api/quiz-attempts",
      "POST",
      start,
    );
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
  gameRequest<GameView>(
    `/api/quiz-attempts/${id}/play${review ? `?review=${review}` : ""}`,
  );
export const submitGameAnswer = (id: number, answerId: number) =>
  gameRequest<GameView>(`/api/quiz-attempts/${id}/answers`, "POST", {
    answerId,
  });
export const finishGame = (id: number) =>
  gameRequest<GameView>(`/api/quiz-attempts/${id}/finish`, "PUT", {});
