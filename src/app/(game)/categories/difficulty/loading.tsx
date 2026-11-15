import styles from "@/features/game/components/difficulty/Difficulty.module.scss";

export default function LoadingDifficultyPage() {
  return (
    <main className={styles.screen}>
      <section className={styles.state}>
        <h1>Choose your difficulty</h1>
        <p role="status">Loading category…</p>
      </section>
    </main>
  );
}
