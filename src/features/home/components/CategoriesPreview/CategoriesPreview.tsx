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
    <Image
      src="/Vector.svg"
      alt=""
      width={586}
      height={556}
      aria-hidden="true"
      className={styles.background}
    />
    <h2 className={styles.title}>Choose a category</h2>
    <Image
      src="/Arrow%202.svg"
      alt=""
      width={71}
      height={82}
      aria-hidden="true"
      className={styles.arrow}
    />
    <ul className={styles.list}>
      {categories.map((category) => (
        <CategoryPreviewCard key={category.title} {...category} />
      ))}
    </ul>
  </div>
);
