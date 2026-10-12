import {
  ApiError,
  apiResponse,
  backendRequest,
  isId,
  jsonBody,
  readMutation,
  requireId,
  requireText,
} from "@/lib/api/server";
import { parsePlayerQuiz } from "@/features/quiz/contracts";

// Existing backend content API, used to provision a real ten-question quiz.
export function POST(request: Request) {
  return apiResponse(async () => {
    const body = await readMutation(request);
    if (
      !Array.isArray(body.questionIds) ||
      body.questionIds.length !== 10 ||
      !body.questionIds.every(isId) ||
      new Set(body.questionIds).size !== 10
    )
      throw new ApiError(
        400,
        "Exactly ten distinct question IDs are required.",
      );
    return backendRequest(
      "/quiz",
      parsePlayerQuiz,
      jsonBody("POST", {
        title: requireText(body.title, "title", 1, 100),
        categoryId: requireId(body.categoryId),
        questionIds: body.questionIds,
      }),
    );
  }, 201);
}
