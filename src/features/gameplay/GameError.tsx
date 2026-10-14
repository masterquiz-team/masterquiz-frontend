import Link from "next/link";
import type { GameFailure } from "./types";
import styles from "./Gameplay.module.scss";
export function GameError({
  error,
  attemptId,
  page,
  pending,
  onReload,
}: {
  error: GameFailure;
  attemptId: number;
  page: number;
  pending: boolean;
  onReload: () => void;
}) {
  return (
    <section className={`${styles.card} ${styles.state}`}>
      <h1>Game unavailable</h1>
      <p role="alert" tabIndex={-1}>
        {error.message}
      </p>
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
