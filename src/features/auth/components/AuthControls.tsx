"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <div className={styles.user}>
            <span className={styles.nickname} title={name ?? undefined}>
              {name}
            </span>
            {score !== null && (
              <span className={styles.score} role="status">
                Score: {score}
              </span>
            )}
          </div>
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
