"use client";

import Link from "next/link";
import { PageState } from "@/components/layout/PageState";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <PageState title="Page unavailable">
      <p role="alert">The page could not be loaded. Please try again.</p>
      <button type="button" onClick={() => retry()}>
        Try again
      </button>
      <Link href="/">Back to home</Link>
    </PageState>
  );
}
