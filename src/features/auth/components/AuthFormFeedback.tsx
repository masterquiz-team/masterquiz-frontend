import { ErrorCircleIcon } from "@/components/ui/TextField";
import type { AuthFeedback } from "../types";
import styles from "./AuthFormFeedback.module.scss";

export function AuthFormFeedback({
  feedback,
  registered,
  className = "",
}: {
  feedback: AuthFeedback | null;
  registered: boolean;
  className?: string;
}) {
  if (!feedback && !registered) return null;
  const isError = feedback?.kind === "error";
  return (
    <div
      className={`${styles.feedback} ${isError ? styles.error : styles.success} ${className}`}
      role={isError ? "alert" : "status"}
    >
      <div className={styles.content}>
        <p>
          {feedback?.message ?? "Your account was created. You can now log in."}
        </p>
        {feedback?.errors && (
          <ul>
            {feedback.errors.map((error, index) => (
              <li key={`${index}-${error}`}>{error}</li>
            ))}
          </ul>
        )}
      </div>
      {isError && <ErrorCircleIcon className={styles.icon} />}
    </div>
  );
}
