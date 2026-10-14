import type { GameView, PlayerAttempt } from "./types";

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
  // Write before the request: a lost response must not create another attempt on reload.
  sessionStorage.setItem(attemptKey(categoryId), "unknown");
  try {
    const attempt = await gameRequest<PlayerAttempt>(
      "/api/quiz-attempts",
      "POST",
      { categoryId, difficulty: "easy" },
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
