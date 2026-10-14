import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CategoriesHeading,
  CategoriesLoading,
  CategoriesScreen,
} from "@/features/categories/components/CategoriesScreen";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage({
  searchParams,
}: PageProps<"/categories">) {
  return (
    <main className={styles.main}>
      <CategoriesHeading />
      <Suspense fallback={<CategoriesLoading />}>
        <CategoriesScreen searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
