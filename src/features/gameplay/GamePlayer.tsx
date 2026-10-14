"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GameView } from "@/features/quiz/types";
import {
  attemptKey,
  gameRequest,
  getGame,
  GameRequestError,
} from "@/features/quiz/client";
import { sharedGameAssets } from "./assets/shared";
import { assets } from "./assets";
import { CorrectArtwork, DesignAsset } from "./GameplayArtwork";
import { QuestionCard, CardMeta, NextButton } from "./QuestionCard";
import { ExitDialog } from "./ExitDialog";
import styles from "./Gameplay.module.scss";

type Failure = { status: number; message: string };
export function GamePlayer({
  attemptId,
  page,
  initialGame,
  initialError,
}: {
  attemptId: number;
  page: number;
  initialGame: GameView | null;
  initialError: Failure | null;
}) {
  const [game, setGame] = useState(initialGame);
  const [error, setError] = useState(initialError);
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [exit, setExit] = useState(false);
  const busy = useRef(false);
  const main = useRef<HTMLDivElement>(null);
  const focusAfter = useRef(false);
  const router = useRouter();
  const backHref = game
    ? `/categories/difficulty?category=${game.category.id}&page=${page}`
    : `/categories?page=${page}`;
  useEffect(() => {
    if (game) {
      try {
        if (game.phase === "finished")
          sessionStorage.removeItem(attemptKey(game.category.id));
        else
          sessionStorage.setItem(
            attemptKey(game.category.id),
            String(attemptId),
          );
      } catch {
        /* The attempt URL remains sufficient for reload/resume. */
      }
    }
    if (!pending && focusAfter.current) {
      focusAfter.current = false;
      main.current
        ?.querySelector<HTMLElement>(error ? '[role="alert"]' : "h1")
        ?.focus();
    }
  }, [game, error, pending, attemptId]);
  async function run(work: () => Promise<GameView>) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const next = await work();
      setGame(next);
      setSelected(null);
    } catch (cause) {
      setError({
        status: cause instanceof GameRequestError ? cause.status : 0,
        message:
          cause instanceof Error
            ? cause.message
            : "The game request could not be confirmed.",
      });
    } finally {
      busy.current = false;
      focusAfter.current = true;
      setPending(false);
    }
  }
  function submit() {
    if (!selected) return;
    void run(() =>
      gameRequest<GameView>(`/api/quiz-attempts/${attemptId}/answers`, "POST", {
        answerId: selected,
      }),
    );
  }
  function advance() {
    void run(() =>
      game?.answered === game?.total
        ? gameRequest<GameView>(
            `/api/quiz-attempts/${attemptId}/finish`,
            "PUT",
            {},
          )
        : getGame(attemptId),
    );
  }
  const question = game?.question;
  const review = game?.review;
  const nextLabel =
    game?.answered === game?.total ? "Finish quiz" : "Next question";
  return (
    <main className={styles.screen}>
      <div className={styles.top}>
        <button
          type="button"
          className={styles.back}
          onClick={() =>
            game && game.phase !== "finished"
              ? setExit(true)
              : router.push(backHref)
          }
          disabled={pending}
        >
          <span aria-hidden="true">
            <DesignAsset src={sharedGameAssets.back} />
          </span>
          Back
        </button>
        <div className={styles.timer} aria-describedby="timer-notice">
          <span>Timer</span>
          <span className={styles.timerValue}>Unavailable</span>
          <button
            type="button"
            className={styles.timerControl}
            disabled
            aria-label="Pause unavailable"
          >
            <DesignAsset src={assets.pause} />
          </button>
        </div>
      </div>
      <div ref={main} className={styles.content} aria-busy={pending}>
        {error ? (
          <section className={`${styles.card} ${styles.state}`}>
            <h1>Game unavailable</h1>
            <p role="alert" tabIndex={-1}>
              {error.message}
            </p>
            <p>
              Attempt {attemptId}. Progress is shown only after it is confirmed
              by the server.
            </p>
            <button
              type="button"
              className={styles.outlineButton}
              disabled={pending}
              onClick={() => void run(() => getGame(attemptId))}
            >
              Reload saved progress
            </button>
            {error.status === 401 && (
              <Link
                href={`/login?${new URLSearchParams({ next: `/quiz/play/${attemptId}?page=${page}` })}`}
              >
                Log in
              </Link>
            )}
          </section>
        ) : question && review?.correct ? (
          <section className={`${styles.card} ${styles.feedbackCard}`}>
            <CardMeta
              category={game!.category.name}
              progress={`${question.index + 1}/${game!.total}`}
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
                <p>
                  {review.explanation ?? "Additional information unavailable."}
                </p>
              </div>
            </aside>
            <NextButton filled disabled={pending} onClick={advance}>
              {nextLabel}
            </NextButton>
          </section>
        ) : question ? (
          <QuestionCard
            category={game!.category.name}
            progress={`${question.index + 1}/${game!.total}`}
            question={question.text}
            options={question.options.map((a) => ({
              id: String(a.id),
              label: a.text,
            }))}
            selectedId={
              review
                ? String(review.answerId)
                : selected
                  ? String(selected)
                  : null
            }
            feedback={
              review
                ? [
                    { optionId: String(review.answerId), outcome: "incorrect" },
                    ...review.correctOptionIds.map((id) => ({
                      optionId: String(id),
                      outcome: "correct" as const,
                    })),
                  ]
                : []
            }
            disabled={pending}
            onSelect={(id) => setSelected(Number(id))}
            next={{
              onClick: review ? advance : submit,
              disabled: pending || (!review && !selected),
              label: review ? nextLabel : "Next",
            }}
          />
        ) : game?.phase === "ready-to-finish" ? (
          <section className={`${styles.card} ${styles.state}`}>
            <h1 tabIndex={-1}>All answers saved</h1>
            <p>
              {game.answered}/{game.total} answers saved. Finish the quiz to
              complete this attempt.
            </p>
            <NextButton filled disabled={pending} onClick={advance}>
              Finish quiz
            </NextButton>
          </section>
        ) : game?.phase === "finished" ? (
          <section className={`${styles.card} ${styles.state}`}>
            <h1 tabIndex={-1}>Quiz finished</h1>
            <p>
              {game.category.name} · {game.title}
            </p>
            <p>
              {game.summary?.correct}/{game.total} correct answers
            </p>
            <p>All {game.answered} answers were saved.</p>
            <Link
              className={styles.primaryButton}
              href={`/categories?page=${page}`}
            >
              Back to categories
            </Link>
          </section>
        ) : null}
        <p className={styles.requestStatus} role="status" aria-live="polite">
          {pending
            ? "Saving or loading your game…"
            : review
              ? review.correct
                ? "Correct answer saved."
                : "Incorrect answer saved. The correct answer is highlighted."
              : ""}
        </p>
        <p id="timer-notice" className={styles.notice}>
          No time limit. Timer and pause are unavailable.
        </p>
        {game && (
          <p className={styles.notice}>
            Attempt {attemptId} · {game.answered}/{game.total} answers saved
          </p>
        )}
      </div>
      <ExitDialog
        open={exit}
        onCancel={() => setExit(false)}
        onConfirm={() => {
          setExit(false);
          router.push(backHref);
        }}
      />
    </main>
  );
}
