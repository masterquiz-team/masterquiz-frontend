"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthField } from "@/features/auth/components/AuthField";
import { saveNickname } from "../services/profile";
import { validateNickname } from "@/lib/nickname";
import styles from "./Profile.module.scss";

export function NicknameForm({ nickname }: { nickname: string }) {
  const router = useRouter();
  const [value, setValue] = useState(nickname);
  const [saved, setSaved] = useState(nickname);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const unchanged = value.trim() === saved;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const error = validateNickname(value);
    setFieldError(error);
    setFeedback(null);
    if (error || unchanged) return;
    setPending(true);
    try {
      const account = await saveNickname(value.trim());
      setSaved(account.nickname);
      setValue(account.nickname);
      setFeedback({ kind: "success", message: "Your username was updated." });
      // The header reads the nickname on the server.
      router.refresh();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "The username was not saved.";
      // Validation errors from the backend belong next to the field.
      if (message.startsWith("Check your username")) setFieldError(message);
      else setFeedback({ kind: "error", message });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <AuthField
        name="nickname"
        label="Username"
        icon="user"
        value={value}
        onValueChange={(next) => {
          setValue(next);
          setFieldError(null);
          setFeedback(null);
        }}
        error={fieldError ?? undefined}
        autoComplete="nickname"
        placeholder="Enter username"
      />
      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={pending || unchanged}
        >
          {pending ? "Please wait…" : "Save changes"}
        </button>
        {!unchanged && !pending && (
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              setValue(saved);
              setFieldError(null);
            }}
          >
            Cancel
          </button>
        )}
      </div>
      {feedback && (
        <p
          className={
            feedback.kind === "error" ? styles.errorText : styles.successText
          }
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      )}
    </form>
  );
}
