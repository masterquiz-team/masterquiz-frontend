import { redirect } from "next/navigation";
import type { AuthFormMode } from "../types";
import { getSessionState } from "@/lib/backend/session";
import { getSafeRedirect } from "../utils/redirect";
import { AuthIllustration } from "./AuthIllustration";
import { AuthForm } from "./AuthForm";
import styles from "./AuthPage.module.scss";

type AuthPageProps = {
  mode: AuthFormMode;
  next?: string;
  registered?: boolean;
};

// This remains a Server Component. Only AuthForm needs client-side state.
export async function AuthPage({
  mode,
  next,
  registered = false,
}: AuthPageProps) {
  const isRegister = mode === "register";
  const redirectTo = getSafeRedirect(next);
  const state = await getSessionState();
  if (state.status === "authenticated") redirect(redirectTo);

  return (
    <main className={`${styles.page} ${isRegister ? styles.pageRegister : ""}`}>
      <section className={styles.welcome}>
        <p className={styles.badge}>
          {isRegister ? "GOOD TO SEE YOU" : "GOOD TO SEE YOU AGAIN"}
        </p>
        <h1 className={styles.title}>
          {isRegister ? "Welcome!" : "Welcome back!"}
        </h1>
        {isRegister ? (
          <p className={`${styles.description} ${styles.descriptionRegister}`}>
            Sign up to compete with others, track your progress, unlock
            achievements and more!
          </p>
        ) : (
          <p className={styles.description}>
            Pick up where you left off and keep your streak going.
          </p>
        )}
        <AuthIllustration />
      </section>
      <AuthForm
        mode={mode}
        redirectTo={redirectTo}
        registered={registered}
        sessionUnavailable={state.status === "unavailable"}
      />
    </main>
  );
}
