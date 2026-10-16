"use client";

import styles from "./Navigation.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { queueSectionScroll, scrollToSection } from "./sectionScroll";

export const Navigation = () => {
  const pathname = usePathname();
  const goToAbout = (event: MouseEvent<HTMLAnchorElement>) => {
    // Keep native behaviour for new-tab and other modified clicks.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (pathname !== "/") {
      queueSectionScroll("about");
      return;
    }
    if (scrollToSection("about")) {
      event.preventDefault();
      window.history.pushState(null, "", "/#about");
    }
  };
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
          <Link
            href="/#about"
            scroll={false}
            className={styles.link}
            onClick={goToAbout}
          >
            About
          </Link>
        </li>
      </ul>
    </nav>
  );
};
