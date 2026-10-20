import type { Metadata } from "next";
import Link from "next/link";
import { getPageSession } from "@/features/auth/server/page-session";
import { loadGame } from "@/features/quiz/server/game";
import { ApiError, parseId, parsePage } from "@/lib/api/server";
import { GamePlayer } from "@/features/gameplay/GamePlayer";
import type { GameView } from "@/features/quiz/types";
import styles from "@/features/gameplay/Gameplay.module.scss";
export const metadata: Metadata = { title: "Easy quiz" };
export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let id = 0,
    page = 0;
  let game: GameView | null = null;
  let error: { status: number; message: string } | null = null;
  let login: string | null = null;
  try {
    id = parseId((await params).attemptId);
    const query = await searchParams;
    if (Array.isArray(query.page))
      throw new ApiError(400, "Use one page parameter.");
    page = parsePage(query.page);
    const session = await getPageSession(`/quiz/play/${id}?page=${page}`);
    if (session.status === "anonymous") {
      login = session.loginHref;
      error = { status: 401, message: "Log in to resume this attempt." };
    } else if (session.status === "unavailable")
      error = {
        status: 503,
        message:
          "Your session could not be verified. Your session has been kept.",
      };
    else game = await loadGame(id);
  } catch (cause) {
    error = {
      status: cause instanceof ApiError ? cause.status : 502,
      message:
        cause instanceof ApiError
          ? cause.message
          : "The game could not be loaded. Please try again.",
    };
  }
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
      {login && <Link href={login}>Log in</Link>}
      <Link href={`/categories?page=${page}`}>Back to categories</Link>
    </main>
  );
}
