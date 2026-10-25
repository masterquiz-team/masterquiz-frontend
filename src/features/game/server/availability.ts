import "server-only";
import { ApiError, invalidContract, isId, isRecord } from "@/lib/api/server";
import { GuestAccessError } from "@/lib/api/errors";
import type { Category } from "@/features/categories/types";
import {
  getDifficulty,
  getDifficultyByApiName,
  type Difficulty,
} from "../difficulty";
import { quizRequest } from "./api";

export async function canStartRandomQuiz(
  category: Pick<Category, "id" | "name">,
  difficulty: Difficulty,
): Promise<boolean> {
  const configuration = getDifficulty(difficulty);
  if (!configuration?.available)
    throw new ApiError(400, "This difficulty is unavailable.");
  // The backend has no count endpoint. Keep question data server-only and
  // count the same category/difficulty pool its random generator uses.
  try {
    return await quizRequest(
      `/questions?${new URLSearchParams({ categoryName: category.name })}`,
      (value) => {
        if (!Array.isArray(value)) invalidContract();
        const ids = new Set<number>();
        let count = 0;
        for (const question of value) {
          if (
            !isRecord(question) ||
            !isId(question.id) ||
            !isRecord(question.category) ||
            question.category.id !== category.id ||
            !getDifficultyByApiName(question.difficultyName) ||
            ids.has(question.id)
          )
            invalidContract();
          ids.add(question.id);
          if (question.difficultyName === configuration.apiName) count++;
        }
        return count >= configuration.questionCount;
      },
    );
  } catch (error) {
    // GET /questions is USER-only; guests must let the random-start endpoint decide.
    if (error instanceof GuestAccessError) return true;
    throw error;
  }
}
