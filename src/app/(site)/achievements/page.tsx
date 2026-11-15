import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageState } from "@/components/layout/PageState";
import { Reveal } from "@/components/ui/Entrance";
import { AchievementsScreen } from "@/features/achievements/components/AchievementsScreen";
import { loadProtectedPage } from "@/features/auth/server/protected-page";
import { ApiError } from "@/lib/api/server";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const result = await loadProtectedPage(
    () => "/achievements",
    async () => null,
  );
  if (result.status === "anonymous") redirect(result.loginHref);
  if (result.status === "guest") redirect("/register?next=%2Fachievements");
  if (result.status === "ok")
    return (
      <Reveal as="main" className={styles.main}>
        <AchievementsScreen />
      </Reveal>
    );
  if (
    result.status === "error" &&
    result.cause instanceof ApiError &&
    result.cause.status === 401 &&
    result.loginHref
  )
    redirect(result.loginHref);
  return (
    <PageState title="Achievements unavailable">
      <p role="alert">
        {result.status === "unavailable"
          ? "Your session could not be verified. Your session has been kept."
          : "Achievements could not be loaded. Please try again."}
      </p>
      <a href="/achievements">Try again</a>
    </PageState>
  );
}
