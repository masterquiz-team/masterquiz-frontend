import type { Metadata } from "next";
import { loadProtectedPage } from "@/features/auth/server/protected-page";
import { loadGame } from "@/features/game/server/game";
import { toGameFailure } from "@/features/game/server/game-failure";
import { ApiError, parseId, parsePage } from "@/lib/api/server";
import { GamePlayer } from "@/features/game/components/play/GamePlayer";
import { GameUnavailable } from "@/features/game/components/play/GameUnavailable";
export const metadata: Metadata = { title: "Quiz" };

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Filled in as parsing progresses so error states keep what was valid.
  const request = { id: 0, page: 0 };
  const result = await loadProtectedPage(
    async () => {
      request.id = parseId((await params).attemptId);
      const query = await searchParams;
      if (Array.isArray(query.page))
        throw new ApiError(400, "Use one page parameter.");
      request.page = parsePage(query.page);
      return `/quiz/play/${request.id}?page=${request.page}`;
    },
    () => loadGame(request.id),
    { allowGuest: true },
  );
  const game = result.status === "ok" ? result.data : null;
  const error = result.status === "ok" ? null : toGameFailure(result);
  const login = result.status === "anonymous" ? result.loginHref : null;
  const { id, page } = request;
  return id > 0 && !login ? (
    <GamePlayer
      key={id}
      attemptId={id}
      page={page}
      initialGame={game}
      initialError={error}
    />
  ) : (
    <GameUnavailable
      message={error?.message}
      loginHref={login}
      playHref={result.href ?? `/quiz/play/${id}?page=${page}`}
      page={page}
    />
  );
}
