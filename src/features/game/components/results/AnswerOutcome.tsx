import Image from "next/image";
import type { GameResultAnswer } from "@/features/game/types";
import { assets } from "@/features/game/assets/play";
import styles from "./ResultsDashboard.module.scss";

export const answerOutcomes = {
  correct: { label: "Correct" },
  wrong: { label: "Wrong" },
  skipped: { label: "Skipped" },
} as const;

export function AnswerOutcomeIcon({
  outcome,
}: {
  outcome: GameResultAnswer["outcome"];
}) {
  return (
    <span className={styles.outcomeIcon} aria-hidden="true">
      {outcome === "skipped" ? (
        "−"
      ) : outcome === "wrong" ? (
        <Image src={assets.wrong.cross} width={18} height={18} alt="" />
      ) : (
        <>
          <Image
            src={assets.wrong.correctBadge}
            width={18}
            height={18}
            alt=""
          />
          <Image
            className={styles.correctCheck}
            src={assets.wrong.check}
            width={11}
            height={9}
            alt=""
          />
        </>
      )}
    </span>
  );
}
