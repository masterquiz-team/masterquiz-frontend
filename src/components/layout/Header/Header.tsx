import styles from "./Header.module.scss";
import { Suspense } from "react";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { AuthControls } from "@/features/auth/components/AuthControls";
import { getSessionState } from "@/features/auth/server/session";
import { AuthControlsLoading } from "@/features/auth/components/AuthControlsLoading";

async function SessionControls() {
  return <AuthControls state={await getSessionState()} />;
}

export const Header = () => {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        MasterQuiz
      </Link>

      <Navigation />

      <Suspense fallback={<AuthControlsLoading />}>
        <SessionControls />
      </Suspense>
    </header>
  );
};
