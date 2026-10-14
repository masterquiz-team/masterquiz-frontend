"use client";
import { useEffect, useRef, useState } from "react";
import type { GameView } from "@/features/quiz/types";
import {
  attemptKey,
  finishGame,
  getGame,
  GameRequestError,
  submitGameAnswer,
} from "@/features/quiz/client";
import type { GameFailure } from "./types";

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
  useEffect(() => {
    if (!game) return;
    try {
      if (game.phase === "finished")
        sessionStorage.removeItem(attemptKey(game.category.id));
      else
        sessionStorage.setItem(attemptKey(game.category.id), String(attemptId));
    } catch {
      // The attempt URL remains sufficient for reload/resume.
    }
  }, [game, attemptId]);

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
      setPending(false);
      setTransition((value) => value + 1);
    }
  }
  function submit() {
    if (selected === null) return;
    void run(() => submitGameAnswer(attemptId, selected));
  }
  function advance() {
    if (!game) return;
    void run(() =>
      game.answered === game.total ? finishGame(attemptId) : getGame(attemptId),
    );
  }
  return {
    game,
    error,
    selected,
    setSelected,
    pending,
    transition,
    submit,
    advance,
    reload: () => void run(() => getGame(attemptId)),
  };
}
