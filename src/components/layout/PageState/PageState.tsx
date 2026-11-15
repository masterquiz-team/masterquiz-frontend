import type { ReactNode } from "react";
import styles from "./PageState.module.scss";

export function PageState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.main}>
      <section className={styles.state}>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}
