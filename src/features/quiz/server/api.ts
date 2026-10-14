import "server-only";
import {
  ApiError,
  backendRequest,
  jsonBody,
  requireId,
} from "@/lib/api/server";
import { requirePagination } from "@/lib/validation";
import {
  parsePlayerAttempt,
  parsePlayerQuiz,
  parsePlayerQuizPage,
  QuizContractError,
} from "../contracts";

async function request<T>(
  path: string,
  parse: (v: unknown) => T,
  init?: RequestInit,
): Promise<T> {
  try {
    return await backendRequest(path, parse, init);
  } catch (error) {
    if (error instanceof QuizContractError)
      throw new ApiError(
        502,
        "The quiz service returned an unexpected response.",
      );
    if (error instanceof ApiError) {
      // Upstream errors can contain private/entity data. Preserve status, not body.
      throw new ApiError(
        error.status,
        error.status === 401
          ? "Please log in to continue."
          : error.status === 403
            ? "The quiz service denied this request. Your session has been kept."
            : error.status === 404
              ? "This quiz or attempt is unavailable."
              : "The quiz service could not complete this request. Please try again.",
      );
    }
    throw error;
  }
}
export function getQuizzesByCategory(categoryId: number, page = 0, size = 12) {
  requireId(categoryId, "categoryId");
  requirePagination(page, size);
  return request(
    `/quiz/category/${categoryId}?${new URLSearchParams({ page: String(page), size: String(size), sort: "id,asc" })}`,
    (value) => {
      const result = parsePlayerQuizPage(value);
      if (
        result.number !== page ||
        result.content.some((q) => q.categoryId !== categoryId)
      )
        throw new QuizContractError();
      return result;
    },
  );
}
export function getQuiz(id: number) {
  return request(`/quiz/${requireId(id)}`, (value) => {
    const quiz = parsePlayerQuiz(value);
    if (quiz.id !== id) throw new QuizContractError();
    return quiz;
  });
}
export function startQuizAttempt(quizId: number) {
  return request(
    "/quiz-attempts",
    (value) => {
      const attempt = parsePlayerAttempt(value);
      if (attempt.quizId !== quizId || attempt.status !== "IN_PROGRESS")
        throw new QuizContractError();
      return attempt;
    },
    jsonBody("POST", { quizId: requireId(quizId, "quizId") }),
  );
}
export function getQuizAttempt(id: number) {
  return request(`/quiz-attempts/${requireId(id)}`, (value) => {
    const attempt = parsePlayerAttempt(value);
    if (attempt.id !== id) throw new QuizContractError();
    return attempt;
  });
}

export { request as quizRequest };
