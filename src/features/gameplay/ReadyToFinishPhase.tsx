import type { GamePhase } from "@/features/quiz/types";
import { NextButton } from "./QuestionCard";
import styles from "./Gameplay.module.scss";
export function ReadyToFinishPhase({
  game,
  pending,
  onFinish,
}: {
  game: GamePhase<"ready-to-finish">;
  pending: boolean;
  onFinish: () => void;
}) {
  return (
    <section className={`${styles.card} ${styles.state}`}>
      <h1 tabIndex={-1}>All answers saved</h1>
      <p>
        {game.answered}/{game.total} answers saved. Finish the quiz to complete
        this attempt.
      </p>
      <NextButton filled disabled={pending} onClick={onFinish}>
        Finish quiz
      </NextButton>
    </section>
  );
}
