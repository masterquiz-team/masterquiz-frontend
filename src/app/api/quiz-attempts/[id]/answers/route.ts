import {
  ApiError,
  apiResponse,
  parseId,
  readMutation,
  requireId,
} from "@/lib/api/server";
import {
  buildGameView,
  getAnsweredQuestions,
  getHistory,
  loadGameContext,
  recordAnswer,
  reviewGame,
  withAttemptMutation,
} from "@/features/quiz/server/game";
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
      const [context, history] = await Promise.all([
        loadGameContext(id),
        getHistory(id),
      ]);
      if (context.attempt.status !== "IN_PROGRESS")
        throw new ApiError(409, "This attempt is already finished.");
      const answered = getAnsweredQuestions(context, history);
      // Replay uses the validated in-memory index, never another POST or option fetch loop.
      for (const [index, record] of answered)
        if (record.answerId === answerId)
          return reviewGame(
            context,
            history,
            context.quiz.listOfQuestions[index].id,
          );
      const game = buildGameView(context, history);
      if (game.phase === "timed-out") return game;
      if (
        game.phase !== "question" ||
        !game.question.options.some((a) => a.id === answerId)
      )
        throw new ApiError(409, "Choose an answer for the current question.");
      const submission = await recordAnswer(id, answerId);
      // Re-read confirmed history, reusing the same validated quiz/options/category.
      return reviewGame(
        context,
        await getHistory(id),
        game.question.id,
        submission,
      );
    });
  }, 201);
}
