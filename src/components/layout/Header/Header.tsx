import styles from "./Header.module.scss";
import { Suspense } from "react";
import { Brand } from "@/components/layout/Brand";
import { Navigation } from "@/components/layout/Navigation";
import { AuthControls } from "@/features/auth/components/AuthControls";
import { getSessionState } from "@/lib/backend/session";
import { AuthControlsLoading } from "@/features/auth/components/AuthControlsLoading";

async function SessionControls() {
  const state = await getSessionState();
  return <AuthControls status={state.status} />;
}

export const Header = () => {
  return (
    <header className={styles.header}>
      <Brand href="/" />

      <Navigation />

      <Suspense fallback={<AuthControlsLoading />}>
        <SessionControls />
      </Suspense>
    </header>
  );
};
