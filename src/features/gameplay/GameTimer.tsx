import type { GameView } from "@/features/quiz/types";
import { assets } from "./assets";
import { DesignAsset } from "./GameplayArtwork";
import styles from "./Gameplay.module.scss";

export function GameTimer({
  game,
  remaining,
}: {
  game: GameView | null;
  remaining: number;
}) {
  const running = game?.phase === "question";
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");
  const announcement =
    !game || game.phase === "finished"
      ? ""
      : remaining === 0
        ? "Time is up."
        : !running
          ? ""
          : remaining <= 10
            ? "Less than ten seconds remaining."
            : remaining <= 30
              ? "Less than thirty seconds remaining."
              : `${Math.ceil(remaining / 60)} minutes remaining.`;
  const label = !game
    ? "Unavailable"
    : game.phase === "finished"
      ? "Finished"
      : remaining === 0
        ? "Time’s up"
        : game.phase === "feedback"
          ? "Answer saved"
          : game.phase === "ready-to-finish"
            ? "All answers saved"
            : `${minutes}:${seconds}`;
  return (
    <div className={styles.timer} aria-describedby="timer-notice">
      <span>Timer</span>
      <span className={styles.timerValue} role="timer" aria-live="off">
        {label}
      </span>
      <span
        className={styles.srOnly}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </span>
      <button
        type="button"
        className={styles.timerControl}
        disabled
        aria-label="Pause unavailable"
      >
        <DesignAsset src={assets.pause} />
      </button>
    </div>
  );
}
