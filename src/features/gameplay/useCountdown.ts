"use client";
import { useEffect, useState } from "react";
import type { GameView } from "@/features/quiz/types";
import { remainingSeconds } from "@/features/quiz/timer";

export function useCountdown(timer: GameView["timer"] | undefined) {
  const initial = timer
    ? remainingSeconds(Date.parse(timer.deadline), Date.parse(timer.serverNow))
    : 0;
  const [sample, setSample] = useState({ timer, remaining: initial });
  useEffect(() => {
    if (!timer) return;
    const receivedAt = Date.now();
    const monotonicStart = performance.now();
    const deadline = Date.parse(timer.deadline);
    const serverNow = Date.parse(timer.serverNow);
    const tick = () => {
      // Anchor to BFF time, catch up after a sleeping/background tab, and do not
      // extend the limit when the browser's wall clock is moved backwards.
      const elapsed = Math.max(
        Date.now() - receivedAt,
        performance.now() - monotonicStart,
      );
      const remaining = remainingSeconds(deadline, serverNow + elapsed);
      setSample((previous) =>
        previous.timer === timer && previous.remaining === remaining
          ? previous
          : { timer, remaining },
      );
    };
    const interval = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [timer]);
  return sample.timer === timer ? sample.remaining : initial;
}
