import Link from "next/link";
import type { GameFailure } from "../../types";
import styles from "./Gameplay.module.scss";
import { GUEST_PLAY_UNAVAILABLE } from "@/lib/api/guest-access";
import { GuestAccessLinks } from "@/features/auth/components/GuestAccessLinks";
import { ATTEMPT_ACCESS_DENIED } from "@/lib/api/errors";
export function GameError({
  error,
  attemptId,
  page,
  pending,
  onReload,
  backHref,
}: {
  error: GameFailure;
  attemptId: number;
  page: number;
  pending: boolean;
  onReload: () => void;
  backHref: string;
}) {
  return (
    <section className={`${styles.card} ${styles.state}`}>
      <h1>Game unavailable</h1>
      <p role="alert" tabIndex={-1}>
        {error.status === 404
          ? "This saved attempt is no longer available. Start a new quiz to continue."
          : error.message}
      </p>
      {(error.status === 404 || error.code === ATTEMPT_ACCESS_DENIED) && (
        <Link href={backHref}>Start a new quiz</Link>
      )}
      {error.code === GUEST_PLAY_UNAVAILABLE && (
        <GuestAccessLinks next={`/quiz/play/${attemptId}?page=${page}`} />
      )}
      <p>
        Attempt {attemptId}. Progress is shown only after it is confirmed by the
        server.
      </p>
      <button
        type="button"
        className={styles.outlineButton}
        disabled={pending}
        onClick={onReload}
      >
        Reload saved progress
      </button>
      {error.status === 401 && (
        <Link
          href={`/login?${new URLSearchParams({ next: `/quiz/play/${attemptId}?page=${page}` })}`}
        >
          Log in
        </Link>
      )}
    </section>
  );
}
