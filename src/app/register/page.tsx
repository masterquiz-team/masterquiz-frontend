import type { Metadata } from "next";
import { AuthPage } from "@/features/auth/components/AuthPage";

export const metadata: Metadata = { title: "Sign up" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  return <AuthPage mode="register" next={query.next} />;
}
