import { PageState } from "@/components/layout/PageState";

export default function LoadingProfilePage() {
  return (
    <PageState title="Your profile">
      <p role="status">Loading profile…</p>
    </PageState>
  );
}
