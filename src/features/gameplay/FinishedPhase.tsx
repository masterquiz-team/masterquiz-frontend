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
      <p>All {game.answered} answers were saved.</p>
      <Link className={styles.primaryButton} href={`/categories?page=${page}`}>
        Back to categories
      </Link>
    </section>
  );
}
