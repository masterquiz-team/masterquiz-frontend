"use client";

import styles from "./global-error.module.scss";

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className={styles.body}>
        <title>Something went wrong | MasterQuiz</title>
        <main className={styles.state}>
          <h1>Something went wrong</h1>
          <p role="alert">MasterQuiz could not be loaded. Please try again.</p>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
          {/* Reload the document to recover the root layout. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">Back to home</a>
        </main>
      </body>
    </html>
  );
}
