import { Header } from "@/components/layout/Header";

// Game screens keep the app header but have no footer.
export default function GameLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
