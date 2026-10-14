import { getCategories } from "@/features/categories/server/api";
import { apiResponse, parsePage } from "@/lib/api/server";

export function GET(request: Request) {
  return apiResponse(() => {
    const query = new URL(request.url).searchParams;
    return getCategories(
      parsePage(query.get("page") ?? undefined),
      query.has("size") ? Number(query.get("size")) : 12,
    );
  });
}
