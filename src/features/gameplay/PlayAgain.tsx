"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { attemptKey, startEasy } from "@/features/quiz/client";
import styles from "./ResultsDashboard.module.scss";

export function PlayAgain({
  categoryId,
  page,
  previousAttemptId,
}: {
  categoryId: number;
  page: number;
  previousAttemptId: number;
}) {
  const router = useRouter();
  const starting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);

  async function start(another = false) {
    if (starting.current) return;
    starting.current = true;
    setPending(true);
    setError(null);
    try {
      const key = attemptKey(categoryId);
      if (another) sessionStorage.removeItem(key);
      const saved = sessionStorage.getItem(key);
      if (saved === "unknown")
        throw new Error(
          "A previous start could not be confirmed. Starting another attempt may create a duplicate. Check the existing attempt before restarting.",
        );
      // Reopening results must not discard a confirmed newer start either.
      if (
        saved &&
        /^\d+$/.test(saved) &&
        Number.isSafeInteger(Number(saved)) &&
        Number(saved) > 0 &&
        Number(saved) !== previousAttemptId
      ) {
        router.push(`/quiz/play/${Number(saved)}?page=${page}`);
        return;
      }
      const attempt = await startEasy(categoryId);
      router.push(`/quiz/play/${attempt.id}?page=${page}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The game could not be started.",
      );
      try {
        setUncertain(
          sessionStorage.getItem(attemptKey(categoryId)) === "unknown",
        );
      } catch {
        setUncertain(false);
      }
      setPending(false);
      starting.current = false;
    }
  }

  return (
    <div className={styles.replay}>
      <button
        type="button"
        className={styles.playAgain}
        disabled={pending}
        onClick={() => void start()}
      >
        {pending ? "Opening your Easy game…" : "Play again"}
        {!pending && <span aria-hidden="true">→</span>}
      </button>
      {error && (
        <p role="alert" className={styles.startError}>
          {error}
        </p>
      )}
      {uncertain && (
        <>
          <p id="replay-warning" className={styles.startError}>
            The previous start could not be confirmed. Starting another attempt
            may create a duplicate.
          </p>
          <button
            type="button"
            className={styles.secondaryLink}
            disabled={pending}
            aria-describedby="replay-warning"
            onClick={() => void start(true)}
          >
            Start another attempt
          </button>
        </>
      )}
    </div>
  );
}
