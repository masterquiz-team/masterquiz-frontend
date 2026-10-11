import styles from "./Navigation.module.scss";
import Link from "next/link";

export const Navigation = () => {
  return (
    <nav>
      <ul className={styles.list}>
        <li>
          <Link href="/" className={styles.link}>
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
  );
};
