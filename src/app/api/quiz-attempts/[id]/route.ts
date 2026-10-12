import { apiResponse, parseId } from "@/lib/api/server";
import { getQuizAttempt } from "@/features/quiz/server/api";
export function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiResponse(async () => getQuizAttempt(parseId((await params).id)));
}
