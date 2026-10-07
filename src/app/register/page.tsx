import styles from "@/features/auth/components/AuthPage.module.scss";
import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/AuthForm";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <main className={styles.page}>
      <AuthForm mode="register" />
    </main>
  );
}
