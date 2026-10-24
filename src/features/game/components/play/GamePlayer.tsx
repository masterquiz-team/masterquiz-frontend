"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { quizListHref } from "@/features/game/routes";
import { useRouter } from "next/navigation";
import type { GameView } from "@/features/game/types";
import { sharedGameAssets } from "../../assets/shared";
import { DesignAsset } from "@/components/ui/DesignAsset";
import { ExitDialog } from "./ExitDialog";
import { FeedbackPhase } from "./FeedbackPhase";
import { FinishedPhase } from "../results/FinishedPhase";
import { GameError } from "./GameError";
import { GameTimer } from "./GameTimer";
import { TimedOutPhase } from "./TimedOutPhase";
import { QuestionPhase } from "./QuestionPhase";
import { ReadyToFinishPhase } from "./ReadyToFinishPhase";
import type { GameFailure } from "../../types";
import { useGame } from "../../hooks/useGame";
import { useGameShortcuts } from "../../hooks/useGameShortcuts";
import styles from "./Gameplay.module.scss";

function GameStep({
  stepKey,
  results,
  onMount,
  children,
}: {
  stepKey: string;
  results: boolean;
  onMount: (key: string) => void;
  children: ReactNode;
}) {
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();
  const animate = !results && reducedMotion === false;
  const mount = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      onMount(stepKey);
      if (!document.querySelector("dialog[open]")) {
        const heading =
          node.querySelector<HTMLElement>('[role="alert"][tabindex]') ??
          node.querySelector<HTMLElement>("h1");
        heading?.focus({ preventScroll: true });
      }
    },
    [onMount, stepKey],
  );
  return (
    <motion.div
      ref={mount}
      className={`${styles.step} ${results ? styles.resultsStep : ""}`}
      inert={!present}
      initial={animate ? { x: 24, opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      exit={animate ? { x: -24, opacity: 0 } : { x: 0, opacity: 1 }}
      transition={{ duration: animate ? 0.3 : 0, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

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
    remaining,
    expired,
    submit,
    advance,
    reload,
  } = useGame(attemptId, initialGame, initialError);
  const [exit, setExit] = useState(false);
  const main = useRef<HTMLDivElement>(null);
  const focusedTransition = useRef(0);
  const router = useRouter();
  const backHref = game
    ? quizListHref(game.category.id, game.difficulty, page)
    : `/categories?page=${page}`;
  const showingResults = !error && game?.phase === "finished";
  const stepKey = error
    ? "error"
    : expired
      ? "timed-out"
      : game?.phase === "question" || game?.phase === "feedback"
        ? `${game.question.index}-${game.phase}`
        : (game?.phase ?? "loading");
  const [mountedStep, setMountedStep] = useState<string | null>(null);
  // State can advance before mode="wait" replaces the old DOM. Keep Escape
  // available, but bind answer shortcuts only once the new step has mounted.
  const stepReady = mountedStep === stepKey;
  const shortcutGame =
    !error &&
    !expired &&
    game &&
    (game.phase === "question" ||
      game.phase === "feedback" ||
      game.phase === "ready-to-finish")
      ? game
      : null;
  const phase = shortcutGame?.phase;
  useGameShortcuts({
    enabled: !!shortcutGame && !pending && !exit,
    optionIds:
      shortcutGame?.phase === "question"
        ? shortcutGame.question.options.map((option) => option.id)
        : [],
    onSelect: stepReady && phase === "question" ? setSelected : undefined,
    onConfirm: !stepReady
      ? undefined
      : phase === "question" && selected !== null
        ? submit
        : phase === "feedback" || phase === "ready-to-finish"
          ? advance
          : undefined,
    onExit: () => setExit(true),
  });
  useEffect(() => {
    if (stepReady && !pending && transition !== focusedTransition.current) {
      focusedTransition.current = transition;
      if (document.querySelector("dialog[open]")) return;
      main.current
        ?.querySelector<HTMLElement>(error ? '[role="alert"]' : "h1")
        ?.focus();
    }
  }, [error, pending, stepReady, transition]);
  return (
    <main
      className={`${styles.screen} ${showingResults ? styles.resultsScreen : ""}`}
    >
      {!showingResults && (
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
            aria-keyshortcuts={shortcutGame ? "Escape" : undefined}
          >
            <span aria-hidden="true">
              <DesignAsset src={sharedGameAssets.back} />
            </span>
            Back
          </button>
          <GameTimer game={game} remaining={remaining} />
        </div>
      )}
      <div ref={main} className={styles.content} aria-busy={pending}>
        <AnimatePresence mode="wait" initial={false}>
          <GameStep
            key={stepKey}
            stepKey={stepKey}
            results={showingResults}
            onMount={setMountedStep}
          >
            {error ? (
              <GameError
                error={error}
                attemptId={attemptId}
                page={page}
                pending={pending}
                onReload={reload}
              />
            ) : expired ? (
              <TimedOutPhase pending={pending} />
            ) : game?.phase === "question" ? (
              <QuestionPhase
                game={game}
                selected={selected}
                pending={pending}
                onSelect={setSelected}
                onSubmit={submit}
              />
            ) : game?.phase === "feedback" ? (
              <FeedbackPhase
                game={game}
                pending={pending}
                onAdvance={advance}
              />
            ) : game?.phase === "ready-to-finish" ? (
              <ReadyToFinishPhase
                game={game}
                pending={pending}
                onFinish={advance}
              />
            ) : game?.phase === "finished" ? (
              <FinishedPhase game={game} page={page} />
            ) : null}
          </GameStep>
        </AnimatePresence>
        <p className={styles.requestStatus} role="status" aria-live="polite">
          {pending
            ? "Saving or loading your game…"
            : game?.phase === "feedback"
              ? game.review.correct
                ? "Correct answer saved."
                : "Incorrect answer saved. The correct answer is highlighted."
              : ""}
        </p>
        {shortcutGame && (
          <p className={styles.shortcuts}>
            Keyboard:{" "}
            {phase === "question" && (
              <>
                <kbd>1</kbd>–<kbd>4</kbd> choose an answer ·{" "}
              </>
            )}
            <kbd>Enter</kbd>{" "}
            {phase === "question"
              ? "submits the answer"
              : phase === "ready-to-finish"
                ? "finishes the quiz"
                : "continues"}{" "}
            · <kbd>Esc</kbd> opens the exit dialog
          </p>
        )}
        {!showingResults && (
          <p id="timer-notice" className={styles.notice}>
            The time limit applies to the whole quiz, including feedback and
            time away. Pause is unavailable.
          </p>
        )}
        {game && !showingResults && (
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
