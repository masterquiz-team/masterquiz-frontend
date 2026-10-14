import Link from "next/link";
import type { Category, CategoryPage } from "../../types";
import { getCategoriesHref } from "./categories-screen-model";
import styles from "./CategoriesScreen.module.scss";

export function CategoriesPagination({
  data,
  page,
  selected,
}: {
  data: CategoryPage;
  page: number;
  selected: Category | null;
}) {
  if (data.totalPages <= 1 || page >= data.totalPages) return null;
  return (
    <nav className={styles.pagination}>
      {page > 0 && (
        <Link href={getCategoriesHref(page - 1, selected?.id)} prefetch={false}>
          Previous
        </Link>
      )}
      <span>
        Page {page + 1} of {data.totalPages}
      </span>
      {!data.last && (
        <Link href={getCategoriesHref(page + 1, selected?.id)} prefetch={false}>
          Next
        </Link>
      )}
    </nav>
  );
}
