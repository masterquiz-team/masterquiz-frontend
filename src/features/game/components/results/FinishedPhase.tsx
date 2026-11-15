"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/ui/Entrance";
import { CountUp } from "@/components/ui/CountUp";
import type { GamePhase } from "@/features/game/types";
import { ResultsAnswers } from "./ResultsAnswers";
import { PlayAgain } from "./PlayAgain";
import { gameStartOf } from "@/features/game/services/game";
import { quizListHref } from "@/features/game/routes";
import { ResultsTrophy } from "./ResultsTrophy";
import styles from "./ResultsDashboard.module.scss";

function formatTime(seconds: number) {
  seconds = Math.round(seconds);
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
            Great job!
          </h1>
          <p>
            You’ve finished the {game.category.name} quiz. Here are your
            results:
          </p>
        </div>
        <dl className={styles.tiles}>
          <div className={styles.scoreTile}>
            <dt>
              <Image
                src="/images/results/metric-score.svg"
                width={23}
                height={23}
                alt=""
                aria-hidden="true"
              />{" "}
              Score
            </dt>
            <dd>
              <strong>
                <CountUp value={summary.pointsEarned} from={0} duration={1} />/
                {summary.maxPoints}
              </strong>
              <span>{summary.correct} correct</span>
            </dd>
          </div>
          <div className={styles.timeTile}>
            <dt>
              <Image
                src="/images/results/metric-time.svg"
                width={23}
                height={23}
                alt=""
                aria-hidden="true"
              />{" "}
              Time
            </dt>
            <dd>
              <strong>
                <CountUp
                  value={summary.elapsedSeconds}
                  from={0}
                  duration={1}
                  format={formatTime}
                />
              </strong>
              <span>out of {formatTime(summary.durationSeconds)}</span>
            </dd>
          </div>
          <div className={styles.accuracyTile}>
            <dt>
              <Image
                src="/images/results/metric-accuracy.svg"
                width={23}
                height={23}
                alt=""
                aria-hidden="true"
              />{" "}
              Accuracy
            </dt>
            <dd>
              <strong>
                <CountUp value={accuracy} from={0} duration={1} />%
              </strong>
              <span>
                {summary.correct}/{summary.total}
              </span>
            </dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <Link
            className={styles.goBack}
            href={quizListHref(game.category.id, game.difficulty, page)}
          >
            Go back
          </Link>
          <PlayAgain
            target={gameStartOf(game)}
            difficulty={game.difficulty}
            page={page}
            previousAttemptId={game.attempt.id}
          />
        </div>
      </section>
      <ResultsAnswers results={results} />
    </Reveal>
  );
}
