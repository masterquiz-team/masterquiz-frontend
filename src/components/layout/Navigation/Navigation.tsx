"use client";

import styles from "./Navigation.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Navigation = () => {
  const pathname = usePathname();
  return (
    <nav>
      <ul className={styles.list}>
        <li>
          <Link
            href="/"
            className={styles.link}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            href="/categories"
            className={styles.link}
            aria-current={pathname === "/categories" ? "page" : undefined}
          >
            Categories
          </Link>
        </li>
        <li>
          <span>Leaderboard</span>{" "}
          <span className={styles.comingSoon}>Coming soon</span>
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
