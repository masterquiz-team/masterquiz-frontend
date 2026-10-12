import { ApiError, apiResponse, parseId } from "@/lib/api/server";
import { loadGame } from "@/features/quiz/server/game";
export function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => {
    const query = new URL(request.url).searchParams;
    if (query.getAll("review").length > 1)
      throw new ApiError(400, "Only one review parameter is accepted.");
    const review = query.get("review");
    return loadGame(
      parseId((await params).id),
      review === null ? undefined : parseId(review),
    );
  });
}
