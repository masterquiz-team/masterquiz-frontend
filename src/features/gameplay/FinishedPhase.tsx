"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GamePhase, GameResultAnswer } from "@/features/quiz/types";
import { PlayAgain } from "./PlayAgain";
import { ResultsTrophy } from "./ResultsTrophy";
import styles from "./ResultsDashboard.module.scss";

const outcomes = {
  correct: { label: "Correct", icon: "✓" },
  wrong: { label: "Wrong", icon: "×" },
  skipped: { label: "Skipped", icon: "−" },
} as const;

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function OutcomeIcon({ outcome }: { outcome: GameResultAnswer["outcome"] }) {
  return (
    <span className={styles.outcomeIcon} aria-hidden="true">
      {outcomes[outcome].icon}
    </span>
  );
}

export function FinishedPhase({
  game,
  page,
}: {
  game: GamePhase<"finished">;
  page: number;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  useEffect(() => {
    heading.current?.focus();
    // Manual finish, timeout and resumed results all refresh the server header.
    router.refresh();
  }, [router]);
  const { summary, results } = game;
  const incorrect = summary.answered - summary.correct;
  const skipped = summary.total - summary.answered;
  const accuracy = Math.round((summary.correct / summary.total) * 100);

  return (
    <div className={styles.dashboard}>
      <section className={styles.overview} aria-labelledby="results-heading">
        <div className={styles.intro}>
          <ResultsTrophy />
          <span className={styles.completed}>Quiz completed!</span>
          <h1 id="results-heading" tabIndex={-1} ref={heading}>
            {game.nickname ? `Great job, ${game.nickname}!` : "Great job!"}
          </h1>
          <p>
            You&apos;ve finished the {game.category.name} quiz.
            <br />
            Here are your results:
          </p>
        </div>
        <dl className={styles.tiles}>
          <div className={styles.scoreTile}>
            <dt>
              <span aria-hidden="true">☆</span> Score
            </dt>
            <dd>
              <strong>
                {summary.pointsEarned} / {summary.maxPoints}
              </strong>
              <span>
                {summary.correct} correct{" "}
                {summary.correct === 1 ? "answer" : "answers"}
              </span>
            </dd>
          </div>
          <div className={styles.timeTile}>
            <dt>
              <span aria-hidden="true">◷</span> Time
            </dt>
            <dd>
              <strong>{formatTime(summary.elapsedSeconds)}</strong>
              <span>out of {formatTime(summary.durationSeconds)}</span>
            </dd>
          </div>
          <div className={styles.accuracyTile}>
            <dt>
              <span aria-hidden="true">◎</span> Accuracy
            </dt>
            <dd>
              <strong>{accuracy}%</strong>
              <span>
                {summary.correct} / {summary.total}
              </span>
            </dd>
          </div>
        </dl>
        <p className={styles.totalScore}>
          Your total score:{" "}
          <strong>{summary.totalScore ?? "Unavailable"}</strong>
        </p>
        <section
          className={styles.breakdown}
          aria-labelledby="breakdown-heading"
        >
          <div className={styles.sectionHeading}>
            <h2 id="breakdown-heading">Question breakdown</h2>
            <span>{summary.total} questions</span>
          </div>
          <ol className={styles.questionGrid} role="list">
            {results.map((answer, index) => (
              <li key={answer.questionId}>
                <a
                  className={`${styles.questionNumber} ${styles[answer.outcome]}`}
                  href={`#result-answer-${answer.questionId}`}
                  aria-label={`Question ${index + 1}: ${outcomes[answer.outcome].label}`}
                >
                  <span>{index + 1}</span>
                  <OutcomeIcon outcome={answer.outcome} />
                </a>
              </li>
            ))}
          </ol>
          <ul
            className={styles.legend}
            role="list"
            aria-label="Answer status legend"
          >
            {Object.entries(outcomes).map(([outcome, { label, icon }]) => (
              <li key={outcome}>
                <span aria-hidden="true">{icon}</span> {label}
              </li>
            ))}
          </ul>
        </section>
        <PlayAgain
          categoryId={game.category.id}
          page={page}
          previousAttemptId={game.attempt.id}
        />
        <Link
          className={styles.secondaryLink}
          href={`/categories?page=${page}`}
        >
          Back to categories
        </Link>
      </section>
      <aside className={styles.answersPanel} aria-labelledby="answers-heading">
        <h2 id="answers-heading">Your answers</h2>
        <ol className={styles.answers} role="list">
          {results.map((answer, index) => (
            <li
              key={answer.questionId}
              id={`result-answer-${answer.questionId}`}
              tabIndex={-1}
              className={`${styles.answerRow} ${styles[answer.outcome]}`}
            >
              <OutcomeIcon outcome={answer.outcome} />
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
                    {outcomes[answer.outcome].label}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ol>
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
    </div>
  );
}
