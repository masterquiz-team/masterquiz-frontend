import { apiResponse, parseId } from "@/lib/api/server";
import { getQuiz } from "@/features/quiz/server/api";

export function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => getQuiz(parseId((await params).id)));
}
