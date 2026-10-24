"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { CountUp } from "@/components/ui/CountUp";
import { logout } from "../services/auth";
import type { AuthSessionState } from "../types";
import styles from "./AuthControls.module.scss";

export function AuthControls({
  status,
  name,
  score,
}: {
  status: AuthSessionState["status"];
  name: string | null;
  score: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scoreBadge = useRef<HTMLSpanElement>(null);
  const previousScore = useRef(score);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const previous = previousScore.current;
    previousScore.current = score;
    if (
      status !== "authenticated" ||
      previous === null ||
      score === null ||
      previous === score ||
      reducedMotion !== false ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !scoreBadge.current
    )
      return;

    const animation = scoreBadge.current.animate(
      [
        {
          backgroundColor: "var(--score-highlight-background)",
          color: "var(--score-highlight-color)",
        },
        {
          backgroundColor: "var(--score-background)",
          color: "var(--score-color)",
        },
      ],
      { duration: 600, easing: "ease-out" },
    );
    return () => animation.cancel();
  }, [score, status, reducedMotion]);

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await logout();
      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to log out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={`${styles.controls} ${status === "authenticated" ? styles.authenticated : ""}`}
    >
      {status === "unavailable" ? (
        <>
          <span role="status">Session unavailable</span>
          <button
            className={styles.action}
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </>
      ) : status === "authenticated" ? (
        <>
          <Link
            href="/profile"
            className={styles.user}
            aria-label={`Profile: ${name ?? "your account"}${score !== null ? `, score ${score}` : ""}`}
            aria-current={pathname === "/profile" ? "page" : undefined}
          >
            <span className={styles.nickname} title={name ?? undefined}>
              {name}
            </span>
            {score !== null && (
              <span ref={scoreBadge} className={styles.score}>
                Score: <CountUp value={score} />
              </span>
            )}
          </Link>
          <button
            className={styles.action}
            onClick={handleLogout}
            disabled={pending}
          >
            {pending ? "Please wait…" : "Log out"}
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={styles.link}>
            Log in
          </Link>
          <Link href="/register" className={styles.action}>
            Sign up
          </Link>
        </>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
