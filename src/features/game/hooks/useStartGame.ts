"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  attemptKey,
  parseSavedAttemptId,
  startNewGame,
  type GameStart,
} from "../services/game";

export function useStartGame({
  page,
  previousAttemptId,
  unconfirmedMessage,
}: {
  page: number;
  previousAttemptId?: number;
  unconfirmedMessage: string;
}) {
  const router = useRouter();
  const starting = useRef(false);
  const [selected, setSelected] = useState<GameStart | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);

  function discardSavedAttempt(target: GameStart) {
    sessionStorage.removeItem(attemptKey(target));
    setUncertain(false);
  }

  async function start(target: GameStart, another = false) {
    if (starting.current) return;
    starting.current = true;
    setSelected(target);
    setPending(true);
    setError(null);
    const key = attemptKey(target);
    try {
      if (another) sessionStorage.removeItem(key);
      const saved = sessionStorage.getItem(key);
      if (saved === "unknown") throw new Error(unconfirmedMessage);
      const savedId = parseSavedAttemptId(saved);
      const id =
        savedId !== null && savedId !== previousAttemptId
          ? savedId
          : (await startNewGame(target)).id;
      router.push(`/quiz/play/${id}?page=${page}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The game could not be started.",
      );
      try {
        setUncertain(sessionStorage.getItem(key) === "unknown");
      } catch {
        setUncertain(false);
      }
      setPending(false);
      starting.current = false;
    }
  }

  return { selected, pending, error, uncertain, start, discardSavedAttempt };
}
