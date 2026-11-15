import type { Metadata } from "next";
import Link from "next/link";
import { getCategory } from "@/features/categories/server/api";
import { loadProtectedPage } from "@/features/auth/server/protected-page";
import { toCategoryPageState } from "@/features/game/server/category-page-state";
import { ApiError, parseId, parsePage } from "@/lib/api/server";
import { getDifficulty, type Difficulty } from "@/features/game/difficulty";
import { listCategoryQuizzes } from "@/features/game/server/quizzes";
import { difficultyHref, quizListHref } from "@/features/game/routes";
import { QuizChooser } from "@/features/game/components/choose/QuizChooser";
import { assets } from "@/features/game/assets/difficulty";
import { DesignAsset } from "@/components/ui/DesignAsset";
import styles from "@/features/game/components/choose/QuizChooser.module.scss";
import { PlayLink } from "@/features/auth/components/PlayLink";
import { GuestAccessLinks } from "@/features/auth/components/GuestAccessLinks";

export const metadata: Metadata = { title: "Choose a quiz" };

export default async function QuizzesPage({
  searchParams,
}: PageProps<"/categories/quizzes">) {
  const query = await searchParams;
  // Filled in as parsing progresses so error states keep what was valid.
  const request: { id: number; page: number; difficulty: Difficulty | null } = {
    id: 0,
    page: 0,
    difficulty: null,
  };
  const result = await loadProtectedPage(
    () => {
      if (Array.isArray(query.page) || typeof query.category !== "string")
        throw new ApiError(400, "A category identifier is required.");
      request.page = parsePage(query.page);
      request.id = parseId(query.category);
      const difficulty = getDifficulty(query.difficulty);
      if (!difficulty?.available)
        throw new ApiError(400, "Choose an available difficulty.");
      request.difficulty = difficulty.id;
      return quizListHref(request.id, difficulty.id, request.page);
    },
    async () => {
      const [category, quizzes] = await Promise.all([
        getCategory(request.id),
        listCategoryQuizzes(request.id, request.difficulty!),
      ]);
      if (category.id !== request.id || !category.name.trim())
        throw new ApiError(502, "Invalid category response.");
      return { category, quizzes };
    },
    { allowGuest: true },
  );
  const { data, message, loginHref, retryHref, playHref, guestRestricted } =
    toCategoryPageState(result, {
      anonymous: "Continue as guest or log in to choose a quiz.",
      fallback: "The quizzes could not be loaded. Please try again.",
    });
  const { id, page, difficulty } = request;
  const backHref =
    id > 0 ? difficultyHref(id, page) : `/categories?page=${page}`;
  return (
    <main className={styles.screen}>
      <nav className={styles.top} aria-label="Quiz navigation">
        <Link href={backHref} prefetch={false} className={styles.back}>
          <span aria-hidden="true">
            <DesignAsset src={assets.back} />
          </span>
          Back
        </Link>
      </nav>
      {data && difficulty ? (
        <QuizChooser
          category={data.category}
          difficulty={difficulty}
          page={page}
          quizzes={data.quizzes}
        />
      ) : (
        <section className={styles.state} aria-labelledby="quizzes-state">
          <h1 id="quizzes-state">Quizzes unavailable</h1>
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
