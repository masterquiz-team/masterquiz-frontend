import {
  createCategory,
  getCategories,
} from "@/features/categories/server/api";
import {
  apiResponse,
  parsePage,
  readMutation,
  requireText,
} from "@/lib/api/server";

export function GET(request: Request) {
  return apiResponse(() => {
    const query = new URL(request.url).searchParams;
    return getCategories(
      parsePage(query.get("page") ?? undefined),
      query.has("size") ? Number(query.get("size")) : 12,
    );
  });
}

export function POST(request: Request) {
  return apiResponse(async () => {
    const body = await readMutation(request);
    return createCategory({ name: requireText(body.name, "name", 2, 20) });
  }, 201);
}
