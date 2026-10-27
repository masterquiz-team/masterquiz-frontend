"use client";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { GameView } from "@/features/game/types";
import {
  attemptKey,
  clearSavedAttempt,
  gameStartOf,
  finishGame,
  getGame,
  GameRequestError,
  submitGameAnswer,
} from "@/features/game/services/game";
import type { GameFailure } from "../types";
import { ATTEMPT_ACCESS_DENIED } from "@/lib/api/errors";
import { useCountdown } from "./useCountdown";

export function useGame(
  attemptId: number,
  initialGame: GameView | null,
  initialError: GameFailure | null,
) {
  const [game, setGame] = useState(initialGame);
  const [error, setError] = useState(initialError);
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [transition, setTransition] = useState(0);
  const [recoveryTarget, setRecoveryTarget] =
    useState<ReturnType<typeof clearSavedAttempt>>(null);
  const busy = useRef(false);
  const timeoutRequested = useRef(false);
  const remaining = useCountdown(
    game?.phase === "finished" ? undefined : game?.timer,
  );
  const expired =
    !!game &&
    game.phase !== "finished" &&
    (game.phase === "timed-out" || remaining === 0);
  // A missing or foreign attempt cannot be resumed from this tab.
  const lost = error?.status === 404 || error?.code === ATTEMPT_ACCESS_DENIED;
  useEffect(() => {
    if (!lost) return;
    try {
      const target = clearSavedAttempt(attemptId);
      if (target) startTransition(() => setRecoveryTarget(target));
    } catch {
      // Recovery navigation remains available if browser storage is blocked.
    }
  }, [attemptId, lost]);
  useEffect(() => {
    if (!game || lost) return;
    const key = attemptKey(gameStartOf(game));
    try {
      if (game.phase === "finished") {
        // A completed page can be reloaded after an uncertain Play again POST.
        // Clear only this attempt, preserving a newer attempt or unknown start.
        if (sessionStorage.getItem(key) === String(attemptId))
          sessionStorage.removeItem(key);
      } else sessionStorage.setItem(key, String(attemptId));
    } catch {
      // The attempt URL remains sufficient for reload/resume.
    }
  }, [game, attemptId, lost]);

  const run = useCallback(async (work: () => Promise<GameView>) => {
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
        code: cause instanceof GameRequestError ? cause.code : undefined,
        message:
          cause instanceof Error
            ? cause.message
            : "The game request could not be confirmed.",
      });
    } finally {
      busy.current = false;
      setPending(false);
      setTransition((value) => value + 1);
    }
  }, []);

  useEffect(() => {
    if (!expired || pending || error || timeoutRequested.current) return;
    const task = window.setTimeout(() => {
      if (busy.current) return;
      timeoutRequested.current = true;
      void run(() => finishGame(attemptId));
    }, 0);
    return () => window.clearTimeout(task);
  }, [attemptId, expired, pending, error, run]);

  function submit() {
    if (selected === null || expired || game?.phase !== "question") return;
    void run(() => submitGameAnswer(attemptId, selected));
  }
  function advance() {
    if (!game) return;
    void run(() =>
      expired || game.answered === game.total
        ? finishGame(attemptId)
        : getGame(attemptId),
    );
  }
  return {
    game,
    error,
    recoveryTarget,
    selected,
    setSelected,
    pending,
    transition,
    remaining,
    expired,
    submit,
    advance,
    reload: () => {
      timeoutRequested.current = false;
      void run(() => getGame(attemptId));
    },
  };
}
