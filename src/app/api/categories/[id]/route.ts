import {
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/features/categories/server/api";
import {
  apiResponse,
  assertSameOrigin,
  parseId,
  readMutation,
  requireText,
} from "@/lib/api/server";

type Context = { params: Promise<{ id: string }> };
export function GET(_request: Request, context: Context) {
  return apiResponse(async () =>
    getCategory(parseId((await context.params).id)),
  );
}
export function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    const id = parseId((await context.params).id);
    const body = await readMutation(request);
    return updateCategory(id, { name: requireText(body.name, "name", 2, 20) });
  });
}
export function DELETE(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    await deleteCategory(parseId((await context.params).id));
  }, 204);
}
