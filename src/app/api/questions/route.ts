import {
  createQuestion,
  getQuestions,
  toQuestion,
  updateQuestion,
} from "@/features/questions/server/api";
import {
  apiResponse,
  readMutation,
  requireId,
  requireText,
} from "@/lib/api/server";

export function GET(request: Request) {
  return apiResponse(async () =>
    (
      await getQuestions(
        requireText(
          new URL(request.url).searchParams.get("categoryName"),
          "categoryName",
          2,
          20,
        ),
      )
    ).map(toQuestion),
  );
}
async function mutate(request: Request, update: boolean) {
  const body = await readMutation(request);
  const input = {
    text: requireText(body.text, "text", 2, 30),
    feedback: requireText(body.feedback, "feedback", 2, 30),
    categoryId: requireId(body.categoryId, "categoryId"),
  };
  return toQuestion(
    await (update
      ? updateQuestion(requireId(body.id), input)
      : createQuestion(input)),
  );
}
export const POST = (request: Request) =>
  apiResponse(() => mutate(request, false), 201);
export const PUT = (request: Request) =>
  apiResponse(() => mutate(request, true));
