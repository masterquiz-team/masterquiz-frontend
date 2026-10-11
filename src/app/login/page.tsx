import styles from "@/features/auth/components/AuthPage.module.scss";
import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <AuthForm mode="login" />
    </main>
  );
}
