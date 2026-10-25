import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadProtectedPage } from "@/features/auth/server/protected-page";
import { getUserProfile } from "@/features/auth/server/profile";
import { getAllCategories } from "@/features/categories/server/api";
import { getLeaderboard } from "@/features/leaderboard/server/leaderboard";
import { demoLeaderboard } from "@/features/leaderboard/demo";
import { LeaderboardScreen } from "@/features/leaderboard/components/LeaderboardScreen";
import { PageState } from "@/components/layout/PageState";
import { Reveal } from "@/components/ui/Entrance";
import { ApiError, parseId } from "@/lib/api/server";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({
  searchParams,
}: PageProps<"/leaderboard">) {
  const query = await searchParams;
  const demo = process.env.NODE_ENV === "development" && query.demo === "1";
  const request = { category: null as number | null };
  const result = await loadProtectedPage(
    () => {
      if (Array.isArray(query.category))
        throw new ApiError(400, "Use one category parameter.");
      request.category = query.category ? parseId(query.category) : null;
      return request.category
        ? `/leaderboard?category=${request.category}`
        : "/leaderboard";
    },
    async () => {
      const [categories, board, profile] = await Promise.all([
        getAllCategories(),
        demo ? demoLeaderboard : getLeaderboard(request.category),
        getUserProfile(),
      ]);
      return { categories, board, profile };
    },
  );
  if (result.status === "anonymous") redirect(result.loginHref);
  if (result.status === "guest")
    redirect(`/register?${new URLSearchParams({ next: result.href })}`);
  if (
    result.status === "error" &&
    result.cause instanceof ApiError &&
    result.cause.status === 401 &&
    result.loginHref
  )
    redirect(result.loginHref);
  if (result.status !== "ok")
    return (
      <PageState title="Leaderboard unavailable">
        <p role="alert">
          {result.status === "unavailable"
            ? "Your session could not be verified. Your session has been kept."
            : "The leaderboard could not be loaded. Please try again."}
        </p>
        <a href="/leaderboard">Try again</a>
      </PageState>
    );
  const { categories, board, profile } = result.data;
  return (
    <Reveal as="main" className={styles.main}>
      <LeaderboardScreen
        board={board}
        categories={categories}
        selected={request.category}
        player={{
          nickname: profile?.nickname ?? null,
          score: profile?.score ?? null,
        }}
        demo={demo}
      />
    </Reveal>
  );
}
