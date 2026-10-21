import type { PlayerAttempt } from "./types";

export function getAttemptDeadline(
  attempt: PlayerAttempt,
  durationMinutes: number,
): number {
  // Java uses LocalDateTime.now() without a zone. Assume the backend JVM is UTC;
  // never interpret this value in the browser's or frontend host's local zone.
  return Date.parse(`${attempt.startedAt}Z`) + durationMinutes * 60_000;
}

export function remainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
