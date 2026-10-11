"use client";

import styles from "./LoginForm.module.scss";

import Link from "next/link";
import { useAuthForm } from "../hooks/useAuthForm";
import type { AuthFormMode } from "../types";
import { AuthFormFields } from "./AuthFormFields";
import { AuthFormFeedback } from "./AuthFormFeedback";
import { AuthSubmitButton } from "./AuthSubmitButton";

export function AuthForm({
  mode,
  redirectTo = "/",
  registered = false,
}: {
  mode: AuthFormMode;
  redirectTo?: string;
  registered?: boolean;
}) {
  const isRegister = mode === "register";
  const { values, pending, feedback, fieldErrors, updateField, handleSubmit } =
    useAuthForm(mode, redirectTo);
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
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <AuthFormFields
          mode={mode}
          values={values}
          errors={fieldErrors}
          pending={pending}
          onFieldChange={updateField}
        />
        {!isRegister && (
          <button type="button" className={styles.forgotPassword}>
            Forgot password?
          </button>
        )}
        <AuthSubmitButton
          mode={mode}
          pending={pending}
          className={styles.submitButton}
        />
        <AuthFormFeedback feedback={feedback} registered={registered} />
      </form>
      <p className={styles.register}>
        {isRegister ? "Already have an account? " : "New to MasterQuiz? "}
        <Link href={`${isRegister ? "/login" : "/register"}${nextQuery}`}>
          {isRegister ? "Log in" : "Register"}
        </Link>
      </p>
    </section>
  );
}
