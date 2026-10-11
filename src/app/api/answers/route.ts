import {
  createAnswer,
  toAnswer,
  updateAnswer,
} from "@/features/answers/server/api";
import {
  apiResponse,
  readMutation,
  requireBoolean,
  requireId,
  requireText,
} from "@/lib/api/server";

async function mutate(request: Request, update: boolean) {
  const body = await readMutation(request);
  const input = {
    text: requireText(body.text, "text", 2, 10),
    correct: requireBoolean(body.correct, "correct"),
  };
  return toAnswer(
    await (update
      ? updateAnswer(requireId(body.id), input)
      : createAnswer({
          ...input,
          questionId: requireId(body.questionId, "questionId"),
        })),
  );
}
export const POST = (request: Request) =>
  apiResponse(() => mutate(request, false), 201);
export const PUT = (request: Request) =>
  apiResponse(() => mutate(request, true));
