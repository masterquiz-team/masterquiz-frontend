"use client";

import styles from "./Navigation.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig, motion, type Variants } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { queueSectionScroll, scrollToSection } from "./sectionScroll";

const MotionLink = motion.create(Link);

// The underline grows from the centre on hover and stays for the current page.
const underline: Variants = {
  rest: { scaleX: 0 },
  shown: { scaleX: 1 },
};

type NavLinkProps = {
  href: string;
  active?: boolean;
  scroll?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
};

const NavLink = ({
  href,
  active = false,
  scroll,
  onClick,
  children,
}: NavLinkProps) => (
  <MotionLink
    href={href}
    scroll={scroll}
    onClick={onClick}
    className={styles.link}
    aria-current={active ? "page" : undefined}
    initial={false}
    animate={active ? "shown" : "rest"}
    whileHover="shown"
  >
    {children}
    <motion.span
      aria-hidden="true"
      className={styles.underline}
      variants={underline}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    />
  </MotionLink>
);

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
    <MotionConfig reducedMotion="user">
      <nav>
        <ul className={styles.list}>
          <li>
            <NavLink href="/" active={pathname === "/"}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink href="/categories" active={pathname === "/categories"}>
              Categories
            </NavLink>
          </li>
          <li>
            <NavLink href="/leaderboard" active={pathname === "/leaderboard"}>
              Leaderboard
            </NavLink>
          </li>
          <li>
            <NavLink href="/#about" scroll={false} onClick={goToAbout}>
              About
            </NavLink>
          </li>
        </ul>
      </nav>
    </MotionConfig>
  );
};
