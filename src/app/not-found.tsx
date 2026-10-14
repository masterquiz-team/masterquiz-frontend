import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageState } from "@/components/layout/PageState";

export default function NotFoundPage() {
  return (
    <SiteShell>
      <PageState title="Page not found">
        <p>This page is unavailable. Please choose another page.</p>
        <Link href="/">Back to home</Link>
        <Link href="/categories">Browse categories</Link>
      </PageState>
    </SiteShell>
  );
}
