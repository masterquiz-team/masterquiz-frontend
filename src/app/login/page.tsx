import type { Metadata } from "next";
import { AuthPage } from "@/features/auth/components/AuthPage";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>;
}) {
  const query = await searchParams;
  return (
    <AuthPage
      mode="login"
      next={query.next}
      registered={query.registered === "1"}
    />
  );
}
