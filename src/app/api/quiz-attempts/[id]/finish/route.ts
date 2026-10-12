import { ApiError, apiResponse, parseId, readMutation } from "@/lib/api/server";
import {
  finishAttempt,
  loadGame,
  withAttemptMutation,
} from "@/features/quiz/server/game";
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
      const game = await loadGame(id);
      if (game.phase === "finished") return game;
      if (game.phase !== "ready-to-finish")
        throw new ApiError(409, "Save all ten answers before finishing.");
      await finishAttempt(id);
      return loadGame(id);
    });
  });
}
