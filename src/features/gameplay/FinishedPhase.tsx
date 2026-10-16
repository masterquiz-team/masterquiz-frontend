import Link from "next/link";
import type { GamePhase } from "@/features/quiz/types";
import styles from "./Gameplay.module.scss";
export function FinishedPhase({
  game,
  page,
}: {
  game: GamePhase<"finished">;
  page: number;
}) {
  return (
    <section className={`${styles.card} ${styles.state}`}>
      <h1 tabIndex={-1}>Quiz finished</h1>
      <p>
        {game.category.name} · {game.title}
      </p>
      <p>
        {game.summary.correct}/{game.total} correct answers
      </p>
      <p>
        {game.answered}/{game.total} answers saved.
      </p>
      {game.answered < game.total && (
        <p>{game.total - game.answered} questions unanswered.</p>
      )}
      <p>Points earned in this attempt: {game.summary.pointsEarned}</p>
      <p>Your total score: {game.summary.totalScore ?? "Unavailable"}</p>
      <Link className={styles.primaryButton} href={`/categories?page=${page}`}>
        Back to categories
      </Link>
    </section>
  );
}
