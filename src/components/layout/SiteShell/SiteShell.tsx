import type { ReactNode } from "react";
import { Header } from "../Header";
import { Footer } from "../Footer";

export function SiteShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
  return className ? <div className={className}>{content}</div> : content;
}
