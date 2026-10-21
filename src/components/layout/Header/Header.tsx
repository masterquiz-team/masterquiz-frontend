import styles from "./Header.module.scss";
import { Suspense } from "react";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { AuthControls } from "@/features/auth/components/AuthControls";
import { getSessionState } from "@/features/auth/server/session";
import { getUserProfile } from "@/features/auth/server/profile";
import { AuthControlsLoading } from "@/features/auth/components/AuthControlsLoading";

async function SessionControls() {
  const state = await getSessionState();
  if (state.status !== "authenticated")
    return <AuthControls status={state.status} name={null} score={null} />;
  const profile = await getUserProfile();
  // Fall back to the session email when the optional profile read fails.
  return (
    <AuthControls
      status={state.status}
      name={profile?.nickname ?? state.session.email}
      score={profile?.score ?? null}
    />
  );
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
