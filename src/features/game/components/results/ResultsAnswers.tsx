import type { GamePhase } from "@/features/game/types";
import { Stagger } from "@/components/ui/Entrance";
import { answerOutcomes, AnswerOutcomeIcon } from "./AnswerOutcome";
import styles from "./ResultsDashboard.module.scss";

export function ResultsAnswers({
  results,
}: Pick<GamePhase<"finished">, "results">) {
  return (
    <aside className={styles.answersPanel} aria-labelledby="answers-heading">
      <h2 id="answers-heading">Your answers</h2>
      <Stagger as="ol" className={styles.answers} role="list">
        {results.map((answer, index) => (
          <li
            key={answer.questionId}
            className={`${styles.answerRow} ${styles[answer.outcome]}`}
          >
            <AnswerOutcomeIcon outcome={answer.outcome} />
            <div className={styles.answerContent}>
              <h3>
                <span className={styles.srOnly}>Question {index + 1}: </span>
                <span className={styles.answerNumber} aria-hidden="true">
                  {index + 1}.
                </span>
                <span>{answer.questionText}</span>
              </h3>
              <span className={styles.srOnly}>
                {answerOutcomes[answer.outcome].label}.{" "}
              </span>
              <div className={styles.answerLines}>
                <p>
                  Your answer:{" "}
                  <span className={styles.chosenAnswer}>
                    {answer.answerText ?? "—"}
                  </span>
                </p>
                {answer.outcome !== "correct" &&
                  answer.correctAnswers.length > 0 && (
                    <p className={styles.correctAnswer}>
                      Correct answer:{" "}
                      <strong>{answer.correctAnswers.join(", ")}</strong>
                    </p>
                  )}
              </div>
            </div>
          </li>
        ))}
      </Stagger>
    </aside>
  );
}
