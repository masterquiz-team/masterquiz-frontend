import Link from "next/link";
import { PlayLink } from "@/features/auth/components/PlayLink";
import styles from "./Gameplay.module.scss";

export function GameUnavailable({
  message,
  loginHref,
  playHref,
  page,
}: {
  message: string | undefined;
  loginHref: string | null;
  playHref: string;
  page: number;
}) {
  return (
    <main className={`${styles.screen} ${styles.state}`}>
      <h1>Game unavailable</h1>
      <p role="alert">{message}</p>
      {loginHref && <PlayLink href={playHref}>Continue as guest</PlayLink>}
      {loginHref && <Link href={loginHref}>Log in</Link>}
      <Link href={`/categories?page=${page}`}>Back to categories</Link>
    </main>
  );
}
