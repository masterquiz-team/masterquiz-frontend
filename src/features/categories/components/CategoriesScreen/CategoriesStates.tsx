import Link from "next/link";
import { Stagger } from "@/components/ui/Entrance";
import { categoryArtwork } from "../../artwork";
import type { Category, CategoryPage } from "../../types";
import { CategoryCard } from "../CategoryCard";
import styles from "./CategoriesScreen.module.scss";

export function CategoriesPreview({ loginHref }: { loginHref: string }) {
  return (
    <Stagger as="ul" className={styles.grid}>
      {categoryArtwork.map(({ name }) => (
        <CategoryCard key={name} name={name} href={loginHref} requiresLogin />
      ))}
    </Stagger>
  );
}

export function CategoriesError({
  message,
  retryHref,
  loginHref,
}: {
  message: string;
  retryHref: string;
  loginHref: string;
}) {
  return (
    <div className={styles.state} role="alert">
      <p>{message}</p>
      <a href={retryHref}>Try again</a>
      <Link href="/categories">Back to categories</Link>
      <Link href={loginHref}>Log in</Link>
    </div>
  );
}

export function CategoriesEmpty({ data }: { data: CategoryPage }) {
  return (
    <div className={styles.state}>
      <p>
        {data.totalElements > 0
          ? "There are no categories on this page."
          : "No categories are available yet."}
      </p>
      {data.totalElements > 0 && (
        <Link href="/categories">Go to the first page</Link>
      )}
    </div>
  );
}

export function CategoriesList({
  categories,
  selected,
  page,
}: {
  categories: Category[];
  selected: Category | null;
  page: number;
}) {
  return (
    <Stagger as="ul" className={styles.grid} key={page}>
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          name={category.name}
          selected={selected?.id === category.id}
          href={`/categories/difficulty?${new URLSearchParams({ page: String(page), category: String(category.id) })}`}
        />
      ))}
    </Stagger>
  );
}
