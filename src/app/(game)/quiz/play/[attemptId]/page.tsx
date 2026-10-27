import type { Metadata } from "next";
import Link from "next/link";
import {
  loadProtectedPage,
  type ProtectedPageResult,
} from "@/features/auth/server/protected-page";
import { loadGame } from "@/features/game/server/game";
import { ApiError, parseId, parsePage } from "@/lib/api/server";
import { GamePlayer } from "@/features/game/components/play/GamePlayer";
import type { GameFailure, GameView } from "@/features/game/types";
import styles from "@/features/game/components/play/Gameplay.module.scss";
import { PlayLink } from "@/features/auth/components/PlayLink";
import {
  GUEST_PLAY_UNAVAILABLE,
  accountRequiredMessage,
} from "@/features/auth/guest-access";
export const metadata: Metadata = { title: "Quiz" };

function toGameFailure(
  result: Exclude<ProtectedPageResult<GameView>, { status: "ok" }>,
): GameFailure {
  switch (result.status) {
    case "anonymous":
      return {
        status: 401,
        message:
          "Continue as guest or log in to open this attempt. Only its owner can resume it.",
      };
    case "guest":
      return {
        status: 403,
        message: accountRequiredMessage,
        code: GUEST_PLAY_UNAVAILABLE,
      };
    case "unavailable":
      return {
        status: 503,
        message:
          "Your session could not be verified. Your session has been kept.",
      };
    case "error":
      return result.cause instanceof ApiError
        ? {
            status: result.cause.status,
            message: result.cause.message,
            ...(result.cause.code ? { code: result.cause.code } : {}),
          }
        : {
            status: 502,
            message: "The game could not be loaded. Please try again.",
          };
  }
}

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
    <main className={`${styles.screen} ${styles.state}`}>
      <h1>Game unavailable</h1>
      <p role="alert">{error?.message}</p>
      {login && (
        <PlayLink href={result.href ?? `/quiz/play/${id}?page=${page}`}>
          Continue as guest
        </PlayLink>
      )}
      {login && <Link href={login}>Log in</Link>}
      <Link href={`/categories?page=${page}`}>Back to categories</Link>
    </main>
  );
}
