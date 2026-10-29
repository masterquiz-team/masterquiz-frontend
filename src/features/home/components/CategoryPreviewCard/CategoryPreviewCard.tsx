import Image from "next/image";
import { PlayLink } from "@/features/auth/components/PlayLink";
import { Icon } from "@/components/ui/Icon";
import styles from "./CategoryPreviewCard.module.scss";

type Props = {
  title: string;
  description: string;
  artwork: "geography" | "history" | "science";
};

export const CategoryPreviewCard = ({ title, description, artwork }: Props) => (
  <li className={styles.item}>
    <PlayLink
      href="/categories"
      className={`${styles.card} ${styles[artwork]}`}
    >
      <Image
        src={`/images/categories/${artwork}.svg`}
        alt=""
        width={120}
        height={105}
        className={styles.artwork}
      />
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
