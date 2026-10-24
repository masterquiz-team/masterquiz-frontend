import type { GamePhase } from "@/features/game/types";
import { Stagger } from "@/components/ui/Entrance";
import { answerOutcomes, AnswerOutcomeIcon } from "./AnswerOutcome";
import styles from "./ResultsDashboard.module.scss";

export function ResultsAnswers({
  results,
  summary,
}: Pick<GamePhase<"finished">, "results" | "summary">) {
  const incorrect = summary.answered - summary.correct;
  const skipped = summary.total - summary.answered;
  return (
    <aside className={styles.answersPanel} aria-labelledby="answers-heading">
      <h2 id="answers-heading">Your answers</h2>
      <Stagger as="ol" className={styles.answers} role="list">
        {results.map((answer, index) => (
          <li
            key={answer.questionId}
            id={`result-answer-${answer.questionId}`}
            tabIndex={-1}
            className={`${styles.answerRow} ${styles[answer.outcome]}`}
          >
            <AnswerOutcomeIcon outcome={answer.outcome} />
            <span className={styles.answerNumber} aria-hidden="true">
              {index + 1}.
            </span>
            <div className={styles.answerContent}>
              <h3>
                <span className={styles.srOnly}>Question {index + 1}: </span>
                {answer.questionText}
              </h3>
              <p>
                Your answer: {answer.answerText ?? "Not answered"}
                <span className={styles.outcomeLabel}>
                  {" · "}
                  {answerOutcomes[answer.outcome].label}
                </span>
              </p>
            </div>
          </li>
        ))}
      </Stagger>
      <section
        className={styles.quickStats}
        aria-labelledby="quick-stats-heading"
      >
        <h2 id="quick-stats-heading">Quick stats</h2>
        <dl>
          <div className={styles.correct}>
            <dt>Correct</dt>
            <dd>{summary.correct}</dd>
          </div>
          <div className={styles.wrong}>
            <dt>Incorrect</dt>
            <dd>{incorrect}</dd>
          </div>
          <div className={styles.skipped}>
            <dt>Skipped</dt>
            <dd>{skipped}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
