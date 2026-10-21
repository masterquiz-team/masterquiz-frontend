import { ApiError, apiResponse, parseId, readMutation } from "@/lib/api/server";
import {
  buildGameView,
  finishAttempt,
  getHistory,
  loadGameContext,
  withAttemptMutation,
  withTotalScore,
} from "@/features/game/server/game";
export function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => {
    const body = await readMutation(request);
    if (Object.keys(body).length)
      throw new ApiError(400, "No finish parameters are accepted.");
    const id = parseId((await params).id);
    return withAttemptMutation(id, async () => {
      const [context, history] = await Promise.all([
        loadGameContext(id),
        getHistory(id),
      ]);
      const game = buildGameView(context, history);
      if (game.phase === "finished") return withTotalScore(game);
      if (game.phase !== "ready-to-finish" && game.phase !== "timed-out")
        throw new ApiError(
          409,
          "Save all ten answers or wait until the time limit before finishing.",
        );
      const attempt = await finishAttempt(id);
      return withTotalScore(
        buildGameView({ ...context, attempt }, await getHistory(id)),
      );
    });
  });
}
