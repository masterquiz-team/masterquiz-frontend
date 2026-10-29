"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  attemptKey,
  getGame,
  parseSavedAttemptId,
  startNewGame,
  GameRequestError,
  type GameStart,
} from "../services/game";
import { GUEST_PLAY_UNAVAILABLE } from "@/lib/api/guest-access";

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
  const [guestRestricted, setGuestRestricted] = useState(false);

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
    setGuestRestricted(false);
    const key = attemptKey(target);
    try {
      if (another) sessionStorage.removeItem(key);
      const saved = sessionStorage.getItem(key);
      if (saved === "unknown") throw new Error(unconfirmedMessage);
      const savedId = parseSavedAttemptId(saved);
      let id: number | null = null;
      if (savedId !== null && savedId !== previousAttemptId) {
        try {
          const game = await getGame(savedId);
          // A timed-out attempt only offers "Time's up"; start a fresh game.
          if (
            game.attempt.status === "IN_PROGRESS" &&
            game.phase !== "timed-out"
          )
            id = savedId;
        } catch (cause) {
          // Reading one saved attempt: 403/404 means the marker belongs to
          // another session or a deleted attempt, never that play is blocked.
          // If guests really cannot play, startNewGame reports it below.
          if (
            !(cause instanceof GameRequestError) ||
            ![403, 404].includes(cause.status)
          )
            throw cause;
        }
        if (id === null) sessionStorage.removeItem(key);
      }
      id ??= (await startNewGame(target)).id;
      router.push(`/quiz/play/${id}?page=${page}`);
    } catch (cause) {
      setGuestRestricted(
        cause instanceof GameRequestError &&
          cause.code === GUEST_PLAY_UNAVAILABLE,
      );
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

  return {
    selected,
    pending,
    error,
    guestRestricted,
    uncertain,
    start,
    discardSavedAttempt,
  };
}
