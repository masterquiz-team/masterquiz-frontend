import {
  ApiError,
  apiResponse,
  parseId,
  readMutation,
  requireId,
} from "@/lib/api/server";
import {
  getHistory,
  getPrivateQuiz,
  getPlayerOptions,
  loadGame,
  recordAnswer,
  withAttemptMutation,
} from "@/features/quiz/server/game";
import { getQuizAttempt } from "@/features/quiz/server/api";
export function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => getHistory(parseId((await params).id)));
}
export function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => {
    const body = await readMutation(request);
    if (Object.keys(body).length !== 1)
      throw new ApiError(400, "Only answerId is accepted.");
    const answerId = requireId(body.answerId);
    const id = parseId((await params).id);
    return withAttemptMutation(id, async () => {
      const attempt = await getQuizAttempt(id);
      if (attempt.status !== "IN_PROGRESS")
        throw new ApiError(409, "This attempt is already finished.");
      const history = await getHistory(id);
      // Replay a confirmed saved answer without issuing a second backend POST.
      if (history.some((a) => a.answerId === answerId)) {
        const quiz = await getPrivateQuiz(attempt.quizId);
        for (const q of quiz.listOfQuestions)
          if ((await getPlayerOptions(q.id)).some((a) => a.id === answerId))
            return loadGame(id, q.id);
        throw new ApiError(
          502,
          "The saved answer could not be matched to this quiz.",
        );
      }
      const game = await loadGame(id);
      if (
        game.phase !== "question" ||
        !game.question ||
        !game.question.options.some((a) => a.id === answerId)
      )
        throw new ApiError(409, "Choose an answer for the current question.");
      await recordAnswer(id, answerId);
      return loadGame(id, game.question.id);
    });
  }, 201);
}
