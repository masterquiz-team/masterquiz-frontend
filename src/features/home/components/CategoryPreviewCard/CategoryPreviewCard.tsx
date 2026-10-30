import Image from "next/image";
import { PlayLink } from "@/features/auth/components/PlayLink";
import { Icon } from "@/components/ui/Icon";
import { getCategoryArtwork } from "@/features/categories/artwork";
import styles from "./CategoryPreviewCard.module.scss";

type Props = {
  title: string;
  description: string;
  tone: "geography" | "history" | "science";
};

export const CategoryPreviewCard = ({ title, description, tone }: Props) => {
  const illustration = getCategoryArtwork(title)?.illustration;
  return (
    <li className={styles.item}>
      <PlayLink href="/categories" className={`${styles.card} ${styles[tone]}`}>
        {illustration && (
          <Image
            src={illustration}
            alt=""
            width={120}
            height={105}
            className={styles.artwork}
          />
        )}
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
        <span className={styles.arrow} aria-hidden="true">
          <Icon name="arrow" className={styles.arrowIcon} />
        </span>
      </PlayLink>
    </li>
  );
};
