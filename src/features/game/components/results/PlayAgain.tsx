"use client";

import { useStartGame } from "@/features/game/hooks/useStartGame";
import { getDifficulty, type Difficulty } from "@/features/game/difficulty";
import type { GameStart } from "@/features/game/services/game";
import styles from "./ResultsDashboard.module.scss";

export function PlayAgain({
  target,
  difficulty,
  page,
  previousAttemptId,
}: {
  target: GameStart;
  difficulty: Difficulty;
  page: number;
  previousAttemptId: number;
}) {
  const { pending, error, uncertain, start } = useStartGame({
    page,
    previousAttemptId,
    unconfirmedMessage:
      "A previous start could not be confirmed. Starting another attempt may create a duplicate. Check the existing attempt before restarting.",
  });

  return (
    <div className={styles.replay}>
      <button
        type="button"
        className={styles.playAgain}
        disabled={pending}
        onClick={() => void start(target)}
      >
        {pending
          ? `Opening your ${getDifficulty(difficulty)?.label ?? ""} game…`
          : "Play again"}
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
            onClick={() => void start(target, true)}
          >
            Start another attempt
          </button>
        </>
      )}
    </div>
  );
}
