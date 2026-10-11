import styles from "./CategoryPreviewCard.module.scss";
import { Icon } from "@/components/ui/Icon";

type Props = {
  title: string;
  description: string;
  background: string;
};

export const CategoryPreviewCard = ({
  title,
  description,
  background,
}: Props) => (
  <li className={styles.card} style={{ backgroundColor: background }}>
    <div className={styles.imagePlaceholder} />
    <div className={styles.content}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
    <span className={styles.arrow} aria-hidden="true">
      <Icon name="arrow" className={styles.arrowIcon} />
    </span>
  </li>
);
