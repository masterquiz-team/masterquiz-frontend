import { getAnswers, toAnswer } from "@/features/answers/server/api";
import { apiResponse, parseId } from "@/lib/api/server";

export function GET(
  _request: Request,
  context: { params: Promise<{ questionId: string }> },
) {
  return apiResponse(async () =>
    (await getAnswers(parseId((await context.params).questionId))).map(
      toAnswer,
    ),
  );
}
