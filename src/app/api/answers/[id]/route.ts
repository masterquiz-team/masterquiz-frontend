import {
  deleteAnswer,
  getAnswer,
  toAnswer,
} from "@/features/answers/server/api";
import { apiResponse, assertSameOrigin, parseId } from "@/lib/api/server";

type Context = { params: Promise<{ id: string }> };
export function GET(_request: Request, context: Context) {
  return apiResponse(async () =>
    toAnswer(await getAnswer(parseId((await context.params).id))),
  );
}
export function DELETE(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    await deleteAnswer(parseId((await context.params).id));
  }, 204);
}
