import type { AuthFeedback } from "../types";
import styles from "./AuthFormFeedback.module.scss";

export function AuthFormFeedback({
  feedback,
  registered,
}: {
  feedback: AuthFeedback | null;
  registered: boolean;
}) {
  if (!feedback && !registered) return null;
  return (
    <div
      className={styles.feedback}
      role={feedback?.kind === "error" ? "alert" : "status"}
    >
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
  );
}
