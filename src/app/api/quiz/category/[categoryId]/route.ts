import { ApiError, apiResponse, parseId, parsePage } from "@/lib/api/server";
import { getQuizzesByCategory } from "@/features/quiz/server/api";

export function GET(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  return apiResponse(async () => {
    const { categoryId } = await params;
    const query = new URL(request.url).searchParams;
    if (query.getAll("page").length > 1)
      throw new ApiError(400, "Only one page parameter is accepted.");
    return getQuizzesByCategory(
      parseId(categoryId),
      parsePage(query.get("page") ?? undefined),
    );
  });
}
