import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadProtectedPage } from "@/features/auth/server/protected-page";
import { getAccount } from "@/features/profile/server/account";
import { ProfileScreen } from "@/features/profile/components/ProfileScreen";
import { PageState } from "@/components/layout/PageState";
import { Reveal } from "@/components/ui/Entrance";
import { ApiError } from "@/lib/api/server";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const result = await loadProtectedPage(() => "/profile", getAccount);
  if (result.status === "anonymous") redirect(result.loginHref);
  if (result.status === "guest") redirect("/register?next=%2Fprofile");
  if (result.status === "ok")
    return (
      <Reveal as="main" className={styles.main}>
        <ProfileScreen account={result.data} />
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
