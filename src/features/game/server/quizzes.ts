import "server-only";
import { ApiError, invalidContract, isId, isRecord } from "@/lib/api/server";
import { parseSpringPage } from "@/lib/validation";
import {
  getDifficulty,
  getDifficultyByApiName,
  type Difficulty,
} from "../difficulty";
import { isGeneratedQuiz, type QuizSummary } from "../quizzes";
import { quizRequest, startQuizAttempt } from "./api";
import { getPrivateQuiz } from "./game";

const PAGE_SIZE = 100;
// Guards against an unbounded loop if the backend reports bogus page counts.
const MAX_PAGES = 10;

type CategoryQuiz = QuizSummary & { categoryId: number };

// The list endpoint returns every question with its correct answer, so only
// the summary fields are kept here.
function parseCategoryQuiz(value: unknown): CategoryQuiz | null {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    typeof value.title !== "string" ||
    !isId(value.categoryId) ||
    !Array.isArray(value.listOfQuestions)
  )
    invalidContract();
  const difficulty = getDifficultyByApiName(value.difficulty);
  // Unknown difficulties are skipped rather than failing the whole list.
  if (!difficulty) return null;
  return {
    id: value.id,
    title: value.title,
    categoryId: value.categoryId,
    difficulty: difficulty.id,
    questionCount: value.listOfQuestions.length,
  };
}

export async function listCategoryQuizzes(
  categoryId: number,
  difficulty: Difficulty,
): Promise<QuizSummary[]> {
  const configuration = getDifficulty(difficulty);
  if (!configuration?.available)
    throw new ApiError(400, "This difficulty is unavailable.");
  const quizzes: QuizSummary[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await quizRequest(
      `/quiz/category/${categoryId}?${new URLSearchParams({ page: String(page), size: String(PAGE_SIZE), sort: "id,asc" })}`,
      (value) => parseSpringPage(value, parseCategoryQuiz),
    );
    for (const quiz of result.content) {
      if (!quiz) continue;
      if (quiz.categoryId !== categoryId) invalidContract();
      // Gameplay requires the exact question count of the difficulty.
      if (
        quiz.difficulty === difficulty &&
        quiz.questionCount === configuration.questionCount &&
        !isGeneratedQuiz(quiz.title)
      )
        quizzes.push({
          id: quiz.id,
          title: quiz.title,
          difficulty: quiz.difficulty,
          questionCount: quiz.questionCount,
        });
    }
    if (result.last) break;
  }
  return quizzes;
}

// getPrivateQuiz rejects quizzes that the gameplay cannot run, so a broken
// quiz is refused before an attempt is created.
export async function startChosenQuiz(quizId: number) {
  await getPrivateQuiz(quizId);
  return startQuizAttempt(quizId);
}
