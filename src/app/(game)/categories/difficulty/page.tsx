import type { Metadata } from "next";
import Link from "next/link";
import { getCategory } from "@/features/categories/server/api";
import { getPageSession } from "@/features/auth/server/page-session";
import { getLoginHref } from "@/features/auth/utils/page-session";
import { getHttpStatusMessage } from "@/lib/http-status-messages";
import { ApiError, parseId, parsePage } from "@/lib/api/server";
import { assets } from "@/features/game/assets/difficulty";
import { DifficultyPicker } from "@/features/game/components/difficulty/DifficultyPicker";
import { DesignAsset } from "@/components/ui/DesignAsset";
import type { Category } from "@/features/categories/types";
import styles from "@/features/game/components/difficulty/Difficulty.module.scss";

export const metadata: Metadata = { title: "Choose your difficulty" };

export default async function DifficultyPage({
  searchParams,
}: PageProps<"/categories/difficulty">) {
  const query = await searchParams;
  let page = 0;
  let category: Category | null = null;
  let message: string | null = null;
  let loginHref: string | null = null;
  let retryHref: string | null = null;
  try {
    if (Array.isArray(query.page) || typeof query.category !== "string")
      throw new ApiError(400, "A category identifier is required.");
    page = parsePage(query.page);
    const id = parseId(query.category);
    const currentHref = `/categories/difficulty?${new URLSearchParams({ category: String(id), page: String(page) })}`;
    const session = await getPageSession(currentHref);
    if (session.status === "anonymous") {
      message =
        "Log in to choose difficulty for an available category. Guest gameplay is unavailable.";
      loginHref = session.loginHref;
    } else if (session.status === "unavailable") {
      message =
        "Your session could not be verified. Please try again. Your session has been kept.";
      retryHref = currentHref;
    } else {
      retryHref = currentHref;
      category = await getCategory(id);
      if (category.id !== id || !category.name.trim())
        throw new ApiError(502, "Invalid category response.");
    }
  } catch (cause) {
    const status = cause instanceof ApiError ? cause.status : undefined;
    message = getHttpStatusMessage(status, {
      fallback: "The category could not be loaded. Please try again.",
      statuses: {
        400: "This category address is invalid. Please choose a category from the list.",
        404: "This category is unavailable. Please choose another category.",
        401: "Please log in again to access this category.",
        403: "Access to this category was denied. Your session has been kept.",
      },
    });
    category = null;
    if (status === 401 && retryHref) loginHref = getLoginHref(retryHref);
  }
  return (
    <main className={styles.screen}>
      <nav className={styles.top} aria-label="Category navigation">
        <Link
          href={`/categories?page=${page}`}
          prefetch={false}
          className={styles.back}
        >
          <span aria-hidden="true">
            <DesignAsset src={assets.back} />
          </span>
          Back
        </Link>
        {category && <span className={styles.category}>{category.name}</span>}
      </nav>
      {category ? (
        <DifficultyPicker key={category.id} category={category} page={page} />
      ) : (
        <section className={styles.state} aria-labelledby="difficulty-state">
          <h1 id="difficulty-state">Difficulty unavailable</h1>
          <p role="alert">{message}</p>
          {loginHref && <Link href={loginHref}>Log in</Link>}
          {retryHref && <a href={retryHref}>Try again</a>}
        </section>
      )}
    </main>
  );
}
