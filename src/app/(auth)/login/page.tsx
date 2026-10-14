import type { Metadata } from "next";
import { AuthPage } from "@/features/auth/components/AuthPage";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const query = await searchParams;
  return (
    <AuthPage
      mode="login"
      next={typeof query.next === "string" ? query.next : undefined}
      registered={query.registered === "1"}
    />
  );
}
