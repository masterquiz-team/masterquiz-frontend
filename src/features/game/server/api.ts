import "server-only";
import {
  ApiError,
  backendRequest,
  jsonBody,
  requireId,
} from "@/lib/api/server";
import { parsePlayerAttempt } from "./contracts";
import {
  ATTEMPT_ACCESS_DENIED,
  ContractError,
  GuestAccessError,
} from "@/lib/api/errors";

// Only calls concerning an existing attempt opt into ownership denial copy.
// backendRequest still owns guest verification, including masked-401 handling.
export async function attemptRequest<T>(
  path: string,
  parse: (v: unknown) => T,
  init?: RequestInit,
): Promise<T> {
  try {
    return await request(path, parse, init);
  } catch (error) {
    if (error instanceof GuestAccessError)
      throw new ApiError(
        403,
        "This game belongs to another session. Start a new quiz.",
        undefined,
        ATTEMPT_ACCESS_DENIED,
      );
    throw error;
  }
}

async function request<T>(
  path: string,
  parse: (v: unknown) => T,
  init?: RequestInit,
): Promise<T> {
  try {
    return await backendRequest(path, parse, init);
  } catch (error) {
    if (error instanceof GuestAccessError) throw error;
    if (error instanceof ContractError)
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
function parseStartedAttempt(value: unknown) {
  const attempt = parsePlayerAttempt(value);
  if (attempt.status !== "IN_PROGRESS") throw new ContractError();
  return attempt;
}
export function startQuizAttempt(quizId: number) {
  return request(
    `/quiz-attempts/${requireId(quizId, "quizId")}`,
    (value) => {
      const attempt = parseStartedAttempt(value);
      if (attempt.quizId !== quizId) throw new ContractError();
      return attempt;
    },
    { method: "POST" },
  );
}
// The backend builds a new quiz from random questions of this difficulty.
export function startRandomQuizAttempt(body: {
  quizTitle: string;
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}) {
  return request(
    "/quiz-attempts/random-quiz",
    parseStartedAttempt,
    jsonBody("POST", body),
  );
}
export function getQuizAttempt(id: number) {
  return attemptRequest(`/quiz-attempts/${requireId(id)}`, (value) => {
    const attempt = parsePlayerAttempt(value);
    if (attempt.id !== id) throw new ContractError();
    return attempt;
  });
}

export { request as quizRequest };
