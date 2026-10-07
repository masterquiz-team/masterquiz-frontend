import styles from "./Header.module.scss";
import Link from "next/link";

export const Header = ({ activeHref }: { activeHref?: string }) => (
  <header className={styles.header}>
    <Link href="/" className={styles.brand}>
      MasterQuiz
    </Link>
    <nav aria-label="Main navigation">
      <ul className={styles.navigation}>
        <li>
          <Link
            href="/"
            aria-current={activeHref === "/" ? "page" : undefined}
            className={styles.homeLink}
          >
            Home
          </Link>
        </li>
        <li>
          <Link href="/#categories" className={styles.link}>
            Categories
          </Link>
        </li>
        <li>
          <span title="Coming soon">Leaderboard</span>
        </li>
        <li>
          <Link href="/#about" className={styles.link}>
            About
          </Link>
        </li>
      </ul>
    </nav>
    <div className={styles.authLinks}>
      <Link
        href="/login"
        aria-current={activeHref === "/login" ? "page" : undefined}
        className={styles.link}
      >
        Log in
      </Link>
      <Link
        href="/register"
        aria-current={activeHref === "/register" ? "page" : undefined}
        className={styles.signUp}
      >
        Sign up
      </Link>
    </div>
  </header>
);
