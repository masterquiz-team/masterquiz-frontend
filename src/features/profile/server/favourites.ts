import "server-only";
import { getAllCategories } from "@/features/categories/server/api";
import { getLeaderboardMe } from "@/features/leaderboard/server/leaderboard";
import type { Category } from "@/features/categories/types";

export async function getFavouriteCategories(): Promise<Category[]> {
  try {
    const [me, categories] = await Promise.all([
      getLeaderboardMe(),
      getAllCategories(),
    ]);
    return categories
      .filter(
        (category) => (me.scoreByCategoryId[String(category.id)] ?? 0) > 0,
      )
      .sort(
        (a, b) =>
          me.scoreByCategoryId[String(b.id)] -
            me.scoreByCategoryId[String(a.id)] || a.id - b.id,
      )
      .slice(0, 5);
  } catch {
    // Favourites are optional; a failed lookup must not break the profile.
    return [];
  }
}
