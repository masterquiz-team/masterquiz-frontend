"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthSessionState } from "../types";
import styles from "./AuthControls.module.scss";

export function AuthControls({
  status,
}: {
  status: AuthSessionState["status"];
}) {
  const pathname = usePathname();

  return (
    <div
      className={styles.controls}
      data-session-unavailable={status === "unavailable" || undefined}
    >
      {status === "unavailable" ? (
        <>
          <span role="status">Session unavailable</span>
          <button
            className={styles.action}
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </>
      ) : status === "authenticated" ? (
        <Link
          href="/profile"
          className={styles.user}
          aria-label="Profile"
          aria-current={pathname === "/profile" ? "page" : undefined}
        >
          <Image
            src="/images/profile/avatar-header.svg"
            width={40}
            height={40}
            alt=""
            unoptimized
          />
        </Link>
      ) : (
        <>
          <Link href="/login" className={styles.link}>
            Log in
          </Link>
          <Link href="/register" className={styles.action}>
            Sign up
          </Link>
        </>
      )}
    </div>
  );
}
