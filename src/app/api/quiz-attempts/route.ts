import {
  ApiError,
  apiResponse,
  readMutation,
  requireId,
} from "@/lib/api/server";
import { getDifficulty } from "@/features/game/difficulty";
import { startGame } from "@/features/game/server/game";
export function POST(request: Request) {
  return apiResponse(async () => {
    const body = await readMutation(request);
    if (
      Object.keys(body).length !== 2 ||
      !("categoryId" in body) ||
      !("difficulty" in body)
    )
      throw new ApiError(400, "Only categoryId and difficulty are accepted.");
    const categoryId = requireId(body.categoryId, "categoryId");
    const difficulty = getDifficulty(body.difficulty);
    if (!difficulty?.available)
      throw new ApiError(400, "This difficulty is unavailable.");
    return startGame(categoryId, difficulty.id);
  }, 201);
}
