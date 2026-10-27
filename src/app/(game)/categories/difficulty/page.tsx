import type { Metadata } from "next";
import Link from "next/link";
import { getCategory } from "@/features/categories/server/api";
import { loadProtectedPage } from "@/features/auth/server/protected-page";
import { toCategoryPageState } from "@/features/game/server/category-page-state";
import { ApiError, parseId, parsePage } from "@/lib/api/server";
import { assets } from "@/features/game/assets/difficulty";
import { DifficultyPicker } from "@/features/game/components/difficulty/DifficultyPicker";
import { DesignAsset } from "@/components/ui/DesignAsset";
import styles from "@/features/game/components/difficulty/Difficulty.module.scss";
import { PlayLink } from "@/features/auth/components/PlayLink";
import { GuestAccessLinks } from "@/features/auth/components/GuestAccessLinks";

export const metadata: Metadata = { title: "Choose your difficulty" };

export default async function DifficultyPage({
  searchParams,
}: PageProps<"/categories/difficulty">) {
  const query = await searchParams;
  // Filled in as parsing progresses so error states keep what was valid.
  const request = { id: 0, page: 0 };
  const result = await loadProtectedPage(
    () => {
      if (Array.isArray(query.page) || typeof query.category !== "string")
        throw new ApiError(400, "A category identifier is required.");
      request.page = parsePage(query.page);
      request.id = parseId(query.category);
      return `/categories/difficulty?${new URLSearchParams({ category: String(request.id), page: String(request.page) })}`;
    },
    async () => {
      const category = await getCategory(request.id);
      if (category.id !== request.id || !category.name.trim())
        throw new ApiError(502, "Invalid category response.");
      return category;
    },
    { allowGuest: true },
  );
  const {
    data: category,
    message,
    loginHref,
    retryHref,
    playHref,
    guestRestricted,
  } = toCategoryPageState(result, {
    anonymous: "Continue as guest or log in to choose a difficulty.",
    fallback: "The category could not be loaded. Please try again.",
  });
  const { page } = request;
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
          {playHref && <PlayLink href={playHref}>Continue as guest</PlayLink>}
          {guestRestricted && <GuestAccessLinks next={result.href} />}
          {loginHref && <Link href={loginHref}>Log in</Link>}
          {retryHref && <a href={retryHref}>Try again</a>}
        </section>
      )}
    </main>
  );
}
