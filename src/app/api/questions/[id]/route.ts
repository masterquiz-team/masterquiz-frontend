import {
  deleteQuestion,
  getQuestion,
  toQuestion,
} from "@/features/questions/server/api";
import { apiResponse, assertSameOrigin, parseId } from "@/lib/api/server";

type Context = { params: Promise<{ id: string }> };
export function GET(_request: Request, context: Context) {
  return apiResponse(async () =>
    toQuestion(await getQuestion(parseId((await context.params).id))),
  );
}
export function DELETE(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    await deleteQuestion(parseId((await context.params).id));
  }, 204);
}
