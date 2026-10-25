"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameView } from "@/features/game/types";
import {
  attemptKey,
  gameStartOf,
  finishGame,
  getGame,
  GameRequestError,
  submitGameAnswer,
} from "@/features/game/services/game";
import type { GameFailure } from "../types";
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
  const busy = useRef(false);
  const timeoutRequested = useRef(false);
  const remaining = useCountdown(
    game?.phase === "finished" ? undefined : game?.timer,
  );
  const expired =
    !!game &&
    game.phase !== "finished" &&
    (game.phase === "timed-out" || remaining === 0);
  useEffect(() => {
    if (!game) return;
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
  }, [game, attemptId]);

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
