import type { AuthFormMode } from "../types";
import styles from "./AuthSubmitButton.module.scss";

export function AuthSubmitButton({
  mode,
  pending,
  className,
}: {
  mode: AuthFormMode;
  pending: boolean;
  className: string;
}) {
  return (
    <button
      type="submit"
      className={`${styles.button} ${className}`}
      disabled={pending}
    >
      {pending
        ? "Please wait…"
        : mode === "register"
          ? "Create an account"
          : "Log in"}
      <svg
        className={styles.arrow}
        viewBox="0 0 28 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M1 9h25m-7-7 7 7-7 7" />
      </svg>
    </button>
  );
}
