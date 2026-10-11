import styles from "./Header.module.scss";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";

export const Header = () => (
  <header className={styles.header}>
    <Link href="/" className={styles.brand}>
      MasterQuiz
    </Link>

    <Navigation />

    <div className={styles.authLinks}>
      <Link href="/login" className={styles.authLink}>
        Log in
      </Link>
      <Link href="/register" className={styles.signUp}>
        Sign up
      </Link>
    </div>
  </header>
);
