"use client";

import styles from "./AuthForm.module.scss";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type Mode = "login" | "register";
type Feedback = { kind: "success" | "error"; message: string; status?: number };

export function AuthForm({ mode }: { mode: Mode }) {
  const isRegister = mode === "register";
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = {
      email: String(values.get("email") ?? "").trim(),
      password: String(values.get("password") ?? ""),
      ...(isRegister
        ? {
            nickname: String(values.get("nickname") ?? "").trim(),
            repeatPassword: String(values.get("repeatPassword") ?? ""),
          }
        : {}),
    };
    if (isRegister && payload.password !== payload.repeatPassword) {
      setFeedback({ kind: "error", message: "Passwords must match." });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setFeedback({
          kind: "error",
          message:
            typeof result.message === "string"
              ? result.message
              : "The request could not be completed. Please try again.",
          status: response.status,
        });
        return;
      }
      if (!isRegister && (typeof result.token !== "string" || !result.token)) {
        setFeedback({
          kind: "error",
          message: "The API responded, but did not return a login token.",
          status: response.status,
        });
        return;
      }
      setFeedback({
        kind: "success",
        message: isRegister
          ? "Your account was created. You can now log in."
          : "Login successful. The API returned an authentication token.",
        status: response.status,
      });
      form.reset();
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to reach the service. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Link href="/" className={styles.link}>
        Home
      </Link>
      <h1 className={styles.title}>{isRegister ? "Sign up" : "Log in"}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <fieldset disabled={pending} className={styles.fields}>
          {isRegister && (
            <label className={styles.label}>
              Nickname
              <input
                className={styles.input}
                name="nickname"
                autoComplete="nickname"
                required
              />
            </label>
          )}
          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 8 : undefined}
              required
            />
          </label>
          {isRegister && (
            <label className={styles.label}>
              Confirm password
              <input
                className={styles.input}
                name="repeatPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          )}
          <button type="submit" className={styles.submitButton}>
            {pending ? "Please wait…" : isRegister ? "Sign up" : "Log in"}
          </button>
        </fieldset>
        <div aria-live="polite" aria-atomic="true">
          {feedback && (
            <p role={feedback.kind === "error" ? "alert" : "status"}>
              {feedback.message}
              {feedback.status && ` (HTTP ${feedback.status})`}
            </p>
          )}
        </div>
      </form>
      <p className={styles.switchLink}>
        <Link
          href={isRegister ? "/login" : "/register"}
          className={styles.link}
        >
          {isRegister ? "Log in" : "Sign up"}
        </Link>
      </p>
      {!isRegister && (
        <p className={styles.notice}>Session is not saved yet.</p>
      )}
    </>
  );
}
