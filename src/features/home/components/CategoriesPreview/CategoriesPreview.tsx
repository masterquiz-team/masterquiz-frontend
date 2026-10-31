import Image from "next/image";
import { categoryAnnotation } from "../../fonts";
import { CategoryPreviewCard } from "../CategoryPreviewCard";
import styles from "./CategoriesPreview.module.scss";

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
    <h2 className={`${styles.title} ${categoryAnnotation.className}`}>
      Choose a category
    </h2>
    <div className={styles.cards}>
      <Image
        src="/images/home/choose-arrow.svg"
        alt=""
        width={68}
        height={129}
        className={styles.arrow}
      />
      <Image
        src="/images/home/categories-blob.svg"
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
      <Image
        src="/images/home/hero-star.svg"
        alt=""
        width={25}
        height={34}
        className={`${styles.star} ${styles.starTop}`}
      />
      <Image
        src="/images/home/hero-star.svg"
        alt=""
        width={25}
        height={34}
        className={`${styles.star} ${styles.starBottom}`}
      />
      <ul className={styles.list}>
        {categories.map((category) => (
          <CategoryPreviewCard key={category.title} {...category} />
        ))}
      </ul>
    </div>
  </div>
);
