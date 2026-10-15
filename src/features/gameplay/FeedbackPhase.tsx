import type { GamePhase } from "@/features/quiz/types";
import { assets } from "./assets";
import { CorrectArtwork, DesignAsset } from "./GameplayArtwork";
import { CardMeta, NextButton, QuestionCard } from "./QuestionCard";
import styles from "./Gameplay.module.scss";
export function FeedbackPhase({
  game,
  pending,
  onAdvance,
}: {
  game: GamePhase<"feedback">;
  pending: boolean;
  onAdvance: () => void;
}) {
  const { question, review } = game;
  const nextLabel =
    game.answered === game.total ? "Finish quiz" : "Next question";
  if (!review.correct)
    return (
      <QuestionCard
        category={game.category.name}
        progress={`${question.index + 1}/${game.total}`}
        question={question.text}
        options={question.options.map((a) => ({ id: a.id, label: a.text }))}
        selectedId={review.answerId}
        feedback={[
          { optionId: review.answerId, outcome: "incorrect" },
          ...review.correctOptionIds.map((id) => ({
            optionId: id,
            outcome: "correct" as const,
          })),
        ]}
        disabled={pending}
        explanation={review.explanation}
        onSelect={() => {}}
        next={{ onClick: onAdvance, disabled: pending, label: nextLabel }}
      />
    );
  return (
    <section className={`${styles.card} ${styles.feedbackCard}`}>
      <CardMeta
        category={game.category.name}
        progress={`${question.index + 1}/${game.total}`}
      />
      <CorrectArtwork />
      <h1 className={styles.feedbackHeading} tabIndex={-1}>
        Correct!
      </h1>
      <p className={styles.explanation}>
        <strong>
          {question.options.find((a) => a.id === review.answerId)?.text}
        </strong>
      </p>
      <aside className={styles.funFact}>
        <span aria-hidden="true">
          <DesignAsset src={assets.correct.lightbulb} />
        </span>
        <div>
          <h2>Fun fact</h2>
          <p>{review.explanation ?? "Additional information unavailable."}</p>
        </div>
      </aside>
      <NextButton filled disabled={pending} onClick={onAdvance}>
        {nextLabel}
      </NextButton>
    </section>
  );
}
