import styles from "@/features/game/components/choose/QuizChooser.module.scss";

export default function LoadingQuizzesPage() {
  return (
    <main className={styles.screen}>
      <section className={styles.state}>
        <h1>Choose a quiz</h1>
        <p role="status">Loading quizzes…</p>
      </section>
    </main>
  );
}
