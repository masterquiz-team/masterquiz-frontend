import { categoryAnnotation } from "../../fonts";
import styles from "./CategoriesPreview.module.scss";
import Image from "next/image";
import { CategoryPreviewCard } from "../CategoryPreviewCard";

const categories = [
  {
    title: "Geography",
    description: "Countries, capitals, landmarks and more.",
    tone: "geography",
  },
  {
    title: "History",
    description: "Events, figures, civilizations and key moments.",
    tone: "history",
  },
  {
    title: "Science",
    description: "The world around us, from nature to technology.",
    tone: "science",
  },
] as const;

export const CategoriesPreview = () => (
  <div id="categories" className={styles.preview}>
    <div className={styles.heading}>
      <h2 className={`${styles.title} ${categoryAnnotation.className}`}>
        Choose a category
      </h2>
      <Image
        src="/Arrow%202.svg"
        alt=""
        width={71}
        height={82}
        className={styles.arrow}
      />
    </div>
    <div className={styles.cards}>
      <Image
        src="/Vector.svg"
        alt=""
        width={586}
        height={556}
        className={styles.background}
      />
      <Image
        src="/images/categories-accent.svg"
        alt=""
        width={52}
        height={91}
        className={styles.accent}
      />
      <ul className={styles.list}>
        {categories.map((category) => (
          <CategoryPreviewCard key={category.title} {...category} />
        ))}
      </ul>
    </div>
  </div>
);
