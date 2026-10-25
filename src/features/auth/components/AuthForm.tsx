"use client";

import styles from "./AuthForm.module.scss";

import Link from "next/link";
import { useId, useState } from "react";
import { useAuthForm } from "../hooks/useAuthForm";
import type { AuthFormMode } from "../types";
import { AuthFormFields } from "./AuthFormFields";
import { AuthFormFeedback } from "./AuthFormFeedback";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { PlayLink } from "./PlayLink";

export function AuthForm({
  mode,
  redirectTo = "/",
  registered = false,
  sessionUnavailable = false,
}: {
  mode: AuthFormMode;
  redirectTo?: string;
  registered?: boolean;
  sessionUnavailable?: boolean;
}) {
  const isRegister = mode === "register";
  const {
    formRef,
    values,
    pending,
    feedback,
    fieldErrors,
    updateField,
    handleSubmit,
  } = useAuthForm(mode, redirectTo);
  const [recoveryNotice, setRecoveryNotice] = useState(false);
  const recoveryId = useId();
  const nextQuery =
    redirectTo === "/" ? "" : `?next=${encodeURIComponent(redirectTo)}`;

  return (
    <section
      className={`${styles.card} ${isRegister ? styles.registerCard : ""}`}
    >
      <svg
        className={styles.accent}
        viewBox="0 0 64 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        aria-hidden="true"
      >
        <path d="m35 4 13 21M2 35l29 9M11 64l15-2.4" />
      </svg>
      <h2 className={styles.title}>
        {isRegister ? "Sign up to MasterQuiz" : "Log in to MasterQuiz"}
      </h2>
      {!isRegister && (
        <div className={styles.subtitlePlaceholder} aria-hidden="true" />
      )}
      {sessionUnavailable && (
        <p className={styles.notice} role="status">
          We cannot verify your current session. Your session has been kept.{" "}
          <button type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
        </p>
      )}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={styles.form}
        noValidate
        aria-busy={pending}
      >
        <AuthFormFields
          mode={mode}
          values={values}
          errors={fieldErrors}
          pending={pending}
          onFieldChange={updateField}
        />
        {!isRegister && (
          <button
            type="button"
            className={styles.forgotPassword}
            aria-controls={recoveryId}
            aria-expanded={recoveryNotice}
            onClick={() => setRecoveryNotice((current) => !current)}
          >
            Forgot password?
          </button>
        )}
        {!isRegister && recoveryNotice && (
          <p id={recoveryId} className={styles.notice} role="status">
            Password recovery is not available yet.
          </p>
        )}
        <AuthSubmitButton
          mode={mode}
          pending={pending}
          className={styles.submitButton}
        />
        <AuthFormFeedback feedback={feedback} registered={registered} />
      </form>
      {!isRegister && (
        <p className={styles.register}>
          <PlayLink href={redirectTo === "/" ? "/categories" : redirectTo}>
            Continue as guest
          </PlayLink>
        </p>
      )}
      <p className={styles.register}>
        {isRegister ? "Already have an account? " : "New to MasterQuiz? "}
        <Link href={`${isRegister ? "/login" : "/register"}${nextQuery}`}>
          {isRegister ? "Log in" : "Register"}
        </Link>
      </p>
    </section>
  );
}
