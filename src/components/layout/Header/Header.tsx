import styles from "./Header.module.scss";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { AuthControls } from "@/features/auth/components/AuthControls";
import { getSessionState } from "@/features/auth/server/session";

export const Header = async () => {
  // A backend outage should not prevent the public page from rendering.
  const state = await getSessionState();
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        MasterQuiz
      </Link>

      <Navigation />

      <AuthControls state={state} />
    </header>
  );
};
