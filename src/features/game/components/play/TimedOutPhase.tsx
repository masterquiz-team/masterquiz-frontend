import styles from "./Gameplay.module.scss";

export function TimedOutPhase({ pending }: { pending: boolean }) {
  return (
    <section className={`${styles.card} ${styles.state}`}>
      <h1 tabIndex={-1}>Time’s up</h1>
      <p>Answering is closed. Your saved answers count toward your results.</p>
      <p role="status">
        {pending
          ? "Finishing your attempt…"
          : "Preparing to finish your attempt…"}
      </p>
    </section>
  );
}
