import type { GameView } from "@/features/game/types";
import { getDifficulty } from "@/features/game/difficulty";
import { assets } from "../../assets/play";
import { DesignAsset } from "@/components/ui/DesignAsset";
import { CountUp } from "@/components/ui/CountUp";
import styles from "./Gameplay.module.scss";

export function GameTimer({
  game,
  remaining,
}: {
  game: GameView | null;
  remaining: number;
}) {
  const running = game?.phase === "question";
  const duration = game ? getDifficulty(game.difficulty)!.durationMinutes : 0;
  const fraction = duration
    ? Math.max(0, Math.min(1, remaining / (duration * 60)))
    : 0;
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
      <span>
        Score: {game ? <CountUp value={game.score} /> : "Unavailable"}
      </span>
      <div className={styles.timerTrack} aria-hidden="true">
        <span
          className={styles.timerFill}
          data-urgency={
            running && remaining > 0
              ? remaining <= 30
                ? "critical"
                : remaining <= 60
                  ? "warning"
                  : undefined
              : undefined
          }
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span
        className={styles.timerValue}
        data-pulse={
          running && remaining > 0 && remaining <= 10 ? "true" : undefined
        }
        role="timer"
        aria-live="off"
      >
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
