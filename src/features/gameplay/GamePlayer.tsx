"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameView } from "@/features/quiz/types";
import { sharedGameAssets } from "./assets/shared";
import { assets } from "./assets";
import { DesignAsset } from "./GameplayArtwork";
import { ExitDialog } from "./ExitDialog";
import { FeedbackPhase } from "./FeedbackPhase";
import { FinishedPhase } from "./FinishedPhase";
import { GameError } from "./GameError";
import { QuestionPhase } from "./QuestionPhase";
import { ReadyToFinishPhase } from "./ReadyToFinishPhase";
import type { GameFailure } from "./types";
import { useGame } from "./useGame";
import styles from "./Gameplay.module.scss";

export function GamePlayer({
  attemptId,
  page,
  initialGame,
  initialError,
}: {
  attemptId: number;
  page: number;
  initialGame: GameView | null;
  initialError: GameFailure | null;
}) {
  const {
    game,
    error,
    selected,
    setSelected,
    pending,
    transition,
    submit,
    advance,
    reload,
  } = useGame(attemptId, initialGame, initialError);
  const [exit, setExit] = useState(false);
  const main = useRef<HTMLDivElement>(null);
  const focusedTransition = useRef(0);
  const router = useRouter();
  const backHref = game
    ? `/categories/difficulty?category=${game.category.id}&page=${page}`
    : `/categories?page=${page}`;
  useEffect(() => {
    if (!pending && transition !== focusedTransition.current) {
      focusedTransition.current = transition;
      main.current
        ?.querySelector<HTMLElement>(error ? '[role="alert"]' : "h1")
        ?.focus();
    }
  }, [error, pending, transition]);
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
          <GameError
            error={error}
            attemptId={attemptId}
            page={page}
            pending={pending}
            onReload={reload}
          />
        ) : game?.phase === "question" ? (
          <QuestionPhase
            game={game}
            selected={selected}
            pending={pending}
            onSelect={setSelected}
            onSubmit={submit}
          />
        ) : game?.phase === "feedback" ? (
          <FeedbackPhase game={game} pending={pending} onAdvance={advance} />
        ) : game?.phase === "ready-to-finish" ? (
          <ReadyToFinishPhase
            game={game}
            pending={pending}
            onFinish={advance}
          />
        ) : game?.phase === "finished" ? (
          <FinishedPhase game={game} page={page} />
        ) : null}
        <p className={styles.requestStatus} role="status" aria-live="polite">
          {pending
            ? "Saving or loading your game…"
            : game?.phase === "feedback"
              ? game.review.correct
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
