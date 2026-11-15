import {
  ApiError,
  apiResponse,
  readMutation,
  requireExactKeys,
  requireId,
} from "@/lib/api/server";
import { getDifficulty } from "@/features/game/difficulty";
import { startGame } from "@/features/game/server/game";
import { startChosenQuiz } from "@/features/game/server/quizzes";

// Body is either { quizId } for a chosen quiz or { categoryId, difficulty }
// for a random one.
export function POST(request: Request) {
  return apiResponse(async () => {
    const body = await readMutation(request);
    if ("quizId" in body) {
      requireExactKeys(body, ["quizId"], "Only quizId is accepted.");
      return startChosenQuiz(requireId(body.quizId, "quizId"));
    }
    requireExactKeys(
      body,
      ["categoryId", "difficulty"],
      "Send quizId, or categoryId and difficulty.",
    );
    const categoryId = requireId(body.categoryId, "categoryId");
    const difficulty = getDifficulty(body.difficulty);
    if (!difficulty?.available)
      throw new ApiError(400, "This difficulty is unavailable.");
    return startGame(categoryId, difficulty.id);
  }, 201);
}
