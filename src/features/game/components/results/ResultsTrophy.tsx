import Image from "next/image";
import styles from "./ResultsDashboard.module.scss";

export function ResultsTrophy() {
  return (
    <Image
      className={styles.trophy}
      src="/images/results/success-trophy.png"
      width={298}
      height={244}
      alt=""
      loading="eager"
    />
  );
}
