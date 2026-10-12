import Link from "next/link";
import { getSession } from "@/features/auth/server/session";
import { getCategories, getCategory } from "../../server/api";
import { categoryArtwork } from "../../design-preview";
import { CategoryCard } from "../CategoryCard/CategoryCard";
import { ApiError, parseId, parsePage } from "@/lib/api/server";
import type { Category, CategoryPage } from "../../types";
import styles from "./CategoriesScreen.module.scss";

type Query = { [key: string]: string | string[] | undefined };
const loginHref = "/login?next=%2Fcategories";

function single(query: Query, key: string): string | undefined {
  const value = query[key];
  if (Array.isArray(value))
    throw new ApiError(400, "Please use one value per query parameter.");
  return value;
}

export function CategoriesHeading() {
  return (
    <h1 className={styles.heading}>
      Pick a category and
      <br />
      start your quiz <span>adventure!</span>
    </h1>
  );
}

export async function CategoriesScreen({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  let data: CategoryPage | null = null;
  let selected: Category | null = null;
  let error: string | null = null;
  let selectionError: string | null = null;
  let signedIn = false;
  let page = 0;
  let requestedCategory: string | undefined;

  try {
    signedIn = Boolean(await getSession());
    if (signedIn) {
      const query = await searchParams;
      page = parsePage(single(query, "page"));
      requestedCategory = single(query, "category");
      data = await getCategories(page);
      if (requestedCategory !== undefined) {
        try {
          selected = await getCategory(parseId(requestedCategory));
        } catch (cause) {
          selectionError =
            cause instanceof ApiError &&
            (cause.status === 400 || cause.status === 404)
              ? "This category is unavailable. Please choose another category."
              : "The selected category could not be loaded. Please try again.";
        }
      }
    }
  } catch (cause) {
    error =
      cause instanceof ApiError && cause.status === 400
        ? "This page address is invalid. Please return to the category list."
        : cause instanceof ApiError &&
            (cause.status === 401 || cause.status === 403)
          ? "Your category list could not be accessed. Please log in again."
          : "Categories could not be loaded. Please try again.";
  }

  const preview = !signedIn && !error;
  const href = (nextPage: number) =>
    `/categories?${new URLSearchParams({ page: String(nextPage), ...(selected ? { category: String(selected.id) } : {}) })}`;
  const retryQuery = new URLSearchParams({
    page: String(page),
    ...(requestedCategory ? { category: requestedCategory } : {}),
  });

  return (
    <div className={styles.screen}>
      <div className={styles.notice} role="status">
        {preview && (
          <p>
            Design preview — <Link href={loginHref}>log in</Link> to browse
            available categories. Preview cards open the login page.
          </p>
        )}
        {signedIn &&
          !error &&
          !selectionError &&
          !selected &&
          data &&
          data.content.length > 0 && <p>Select a category to continue.</p>}
        {selected && !selectionError && (
          <p>
            Selected: <strong>{selected.name}</strong>. Quiz setup is coming
            soon.{" "}
            <Link href={`/categories?page=${page}`} scroll={false}>
              Clear selection
            </Link>
          </p>
        )}
        {selectionError && (
          <p>
            {selectionError}{" "}
            <Link href={`/categories?page=${page}`}>Back to categories</Link> ·{" "}
            <a href={`/categories?${retryQuery}`}>Try again</a>
          </p>
        )}
      </div>

      {error ? (
        <div className={styles.state} role="alert">
          <p>{error}</p>
          <a href={`/categories?${retryQuery}`}>Try again</a>
          <Link href="/categories">Back to categories</Link>
          <Link href={loginHref}>Log in</Link>
        </div>
      ) : preview ? (
        <ul className={styles.grid}>
          {categoryArtwork.map(({ name }) => (
            <CategoryCard
              key={name}
              name={name}
              href={loginHref}
              requiresLogin
            />
          ))}
        </ul>
      ) : data?.content.length ? (
        <ul className={styles.grid}>
          {data.content.map((category) => (
            <CategoryCard
              key={category.id}
              name={category.name}
              selected={selected?.id === category.id}
              href={`/categories?${new URLSearchParams({ page: String(page), category: String(category.id) })}`}
            />
          ))}
        </ul>
      ) : (
        <div className={styles.state}>
          <p>
            {data && data.totalElements > 0
              ? "There are no categories on this page."
              : "No categories are available yet."}
          </p>
          {data && data.totalElements > 0 && (
            <Link href="/categories">Go to the first page</Link>
          )}
        </div>
      )}

      {data && data.totalPages > 1 && page < data.totalPages && (
        <nav className={styles.pagination}>
          {page > 0 && (
            <Link href={href(page - 1)} prefetch={false}>
              Previous
            </Link>
          )}
          <span>
            Page {page + 1} of {data.totalPages}
          </span>
          {!data.last && (
            <Link href={href(page + 1)} prefetch={false}>
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

export function CategoriesLoading() {
  return (
    <div className={styles.screen}>
      <p className={styles.notice} role="status">
        Loading categories…
      </p>
      <ul className={styles.grid} aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <li key={index} className={styles.loadingCard} />
        ))}
      </ul>
    </div>
  );
}
