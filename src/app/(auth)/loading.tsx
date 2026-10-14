import { PageState } from "@/components/layout/PageState";

export default function LoadingAuthPage() {
  return (
    <PageState title="Please wait…">
      <p role="status">Checking session…</p>
    </PageState>
  );
}
