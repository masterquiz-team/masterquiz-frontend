import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUnlockedBadges } from "@/features/achievements/server/achievements";
import { loadProtectedPage } from "@/features/auth/server/protected-page";
import { getFavouriteCategories } from "@/features/profile/server/favourites";
import { getAccount } from "@/features/profile/server/account";
import { ProfileScreen } from "@/features/profile/components/ProfileScreen";
import { PageState } from "@/components/layout/PageState";
import { Reveal } from "@/components/ui/Entrance";
import { ApiError } from "@/lib/api/server";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const result = await loadProtectedPage(
    () => "/profile",
    async () => {
      const [account, favourites, badges] = await Promise.all([
        getAccount(),
        getFavouriteCategories(),
        // Badges are optional; a failed lookup must not break the profile.
        getUnlockedBadges().catch(() => null),
      ]);
      return { account, favourites, badges };
    },
  );
  if (result.status === "anonymous") redirect(result.loginHref);
  if (result.status === "guest") redirect("/register?next=%2Fprofile");
  if (result.status === "ok")
    return (
      <Reveal as="main" className={styles.main}>
        <ProfileScreen
          account={result.data.account}
          favourites={result.data.favourites}
          unlockedBadges={result.data.badges}
        />
      </Reveal>
    );
  const expired =
    result.status === "error" &&
    result.cause instanceof ApiError &&
    result.cause.status === 401;
  if (expired && result.loginHref) redirect(result.loginHref);
  return (
    <PageState title="Profile unavailable">
      <p role="alert">
        {result.status === "unavailable"
          ? "Your session could not be verified. Your session has been kept."
          : "Your profile could not be loaded. Please try again."}
      </p>
      <a href="/profile">Try again</a>
    </PageState>
  );
}
