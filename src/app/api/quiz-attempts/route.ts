import {
  ApiError,
  apiResponse,
  readMutation,
  requireId,
} from "@/lib/api/server";
import { startQuizAttempt } from "@/features/quiz/server/api";
import { getPrivateQuiz, getPlayerOptions } from "@/features/quiz/server/game";
export function POST(request: Request) {
  return apiResponse(async () => {
    const body = await readMutation(request);
    if (Object.keys(body).length !== 1)
      throw new ApiError(400, "Only quizId is accepted.");
    const quizId = requireId(body.quizId);
    const quiz = await getPrivateQuiz(quizId);
    await Promise.all(quiz.listOfQuestions.map((q) => getPlayerOptions(q.id)));
    return startQuizAttempt(quizId);
  }, 201);
}
