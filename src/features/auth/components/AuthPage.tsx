import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { redirect } from "next/navigation";
import type { AuthFormMode } from "../types";
import { getSession } from "../server/session";
import { getSafeRedirect } from "../utils/redirect";
import { AuthForm } from "./AuthForm";
import styles from "./LoginPage.module.scss";

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
  const session = await getSession().catch(() => null);
  if (session) redirect(redirectTo);

  return (
    <div className={styles.shell}>
      <Header />
      <main
        className={`${styles.page} ${isRegister ? styles.pageRegister : ""}`}
      >
        <section className={styles.welcome}>
          <p className={styles.badge}>
            {isRegister ? "GOOD TO SEE YOU" : "GOOD TO SEE YOU AGAIN"}
          </p>
          <h1 className={styles.title}>
            {isRegister ? "Welcome!" : "Welcome back!"}
          </h1>
          <div className={styles.descriptionPlaceholder} aria-hidden="true">
            <span />
            <span />
          </div>
          <svg
            className={styles.illustrationPlaceholder}
            viewBox="0 0 416 410"
            fill="none"
            stroke="black"
            strokeWidth="1"
            aria-hidden="true"
          >
            <rect x="0.5" y="0.5" width="415" height="409" />
            <path d="M0.5 0.5L415.5 409.5M415.5 0.5L0.5 409.5" />
          </svg>
        </section>
        <AuthForm mode={mode} redirectTo={redirectTo} registered={registered} />
      </main>
      <Footer />
    </div>
  );
}
