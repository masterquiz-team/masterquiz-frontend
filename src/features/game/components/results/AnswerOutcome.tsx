import type { GameResultAnswer } from "@/features/game/types";
import styles from "./ResultsDashboard.module.scss";

export const answerOutcomes = {
  correct: { label: "Correct", icon: "✓" },
  wrong: { label: "Wrong", icon: "×" },
  skipped: { label: "Skipped", icon: "−" },
} as const;

export function AnswerOutcomeIcon({
  outcome,
}: {
  outcome: GameResultAnswer["outcome"];
}) {
  return (
    <span className={styles.outcomeIcon} aria-hidden="true">
      {answerOutcomes[outcome].icon}
    </span>
  );
}
