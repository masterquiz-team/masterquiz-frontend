import styles from "./CategoriesPreview.module.scss";
import Image from "next/image";
import { CategoryPreviewCard } from "../CategoryPreviewCard";

const categories = [
  {
    title: "Geography",
    description: "Lorem ipsum dolor sit amet, consectetur.",
    background: "#F0EFFD",
  },
  {
    title: "History",
    description: "Lorem ipsum dolor sit amet, consectetur.",
    background: "#EFFAF6",
  },
  {
    title: "Science",
    description: "Lorem ipsum dolor sit amet, consectetur.",
    background: "#ECF5FD",
  },
];

export const CategoriesPreview = () => (
  <div id="categories" className={styles.preview}>
    <div className={styles.heading}>
      <h2 className={styles.title}>Choose a category</h2>
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
