import type { GameView, PlayerAttempt, PlayerQuizPage } from "./types";

export class GameRequestError extends Error {
  constructor(
    public status: number,
    message: string,
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
    );
  return value as T;
}
export const attemptKey = (categoryId: number) =>
  `masterquiz-easy-attempt:${categoryId}`;
export async function startEasy(categoryId: number): Promise<PlayerAttempt> {
  let page = 0;
  while (page < 100) {
    const quizzes = await gameRequest<PlayerQuizPage>(
      `/api/quiz/category/${categoryId}?page=${page}`,
    );
    const quiz = quizzes.content.find((q) => q.listOfQuestions.length === 10);
    if (quiz) {
      // A lost start response must not cause an automatic second attempt on reload.
      sessionStorage.setItem(attemptKey(categoryId), "unknown");
      try {
        const attempt = await gameRequest<PlayerAttempt>(
          "/api/quiz-attempts",
          "POST",
          { quizId: quiz.id },
        );
        sessionStorage.setItem(attemptKey(categoryId), String(attempt.id));
        return attempt;
      } catch (error) {
        if (
          error instanceof GameRequestError &&
          error.status >= 400 &&
          error.status < 500
        )
          sessionStorage.removeItem(attemptKey(categoryId));
        throw error;
      }
    }
    if (quizzes.last || ++page >= quizzes.totalPages) break;
  }
  throw new GameRequestError(
    404,
    "No ten-question quiz is available in this category yet.",
  );
}
export const getGame = (id: number, review?: number) =>
  gameRequest<GameView>(
    `/api/quiz-attempts/${id}/play${review ? `?review=${review}` : ""}`,
  );
