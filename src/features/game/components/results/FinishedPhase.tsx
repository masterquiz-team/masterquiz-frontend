"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/ui/Entrance";
import type { GamePhase } from "@/features/game/types";
import { answerOutcomes, AnswerOutcomeIcon } from "./AnswerOutcome";
import { ResultsAnswers } from "./ResultsAnswers";
import { PlayAgain } from "./PlayAgain";
import { gameStartOf } from "@/features/game/services/game";
import { quizListHref } from "@/features/game/routes";
import { ResultsTrophy } from "./ResultsTrophy";
import styles from "./ResultsDashboard.module.scss";

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
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
  const accuracy = Math.round((summary.correct / summary.total) * 100);

  return (
    <Reveal className={styles.dashboard}>
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
                  aria-label={`Question ${index + 1}: ${answerOutcomes[answer.outcome].label}`}
                >
                  <span>{index + 1}</span>
                  <AnswerOutcomeIcon outcome={answer.outcome} />
                </a>
              </li>
            ))}
          </ol>
          <ul
            className={styles.legend}
            role="list"
            aria-label="Answer status legend"
          >
            {Object.entries(answerOutcomes).map(
              ([outcome, { label, icon }]) => (
                <li key={outcome}>
                  <span aria-hidden="true">{icon}</span> {label}
                </li>
              ),
            )}
          </ul>
        </section>
        <PlayAgain
          target={gameStartOf(game)}
          difficulty={game.difficulty}
          page={page}
          previousAttemptId={game.attempt.id}
        />
        <Link
          className={styles.secondaryLink}
          href={quizListHref(game.category.id, game.difficulty, page)}
        >
          Choose another quiz
        </Link>
      </section>
      <ResultsAnswers results={results} summary={summary} />
    </Reveal>
  );
}
