import styles from "./Header.module.scss";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { AuthControls } from "@/features/auth/components/AuthControls";
import { getSession } from "@/features/auth/server/session";

export const Header = async () => {
  // A backend outage should not prevent the public page from rendering.
  const session = await getSession().catch(() => null);
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        MasterQuiz
      </Link>

      <Navigation />

      <AuthControls session={session} />
    </header>
  );
};
