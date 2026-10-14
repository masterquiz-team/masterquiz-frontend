import {
  CategoriesHeading,
  CategoriesLoading,
} from "@/features/categories/components/CategoriesScreen";
import styles from "./page.module.scss";

export default function LoadingCategoriesPage() {
  return (
    <main className={styles.main}>
      <CategoriesHeading />
      <CategoriesLoading />
    </main>
  );
}
