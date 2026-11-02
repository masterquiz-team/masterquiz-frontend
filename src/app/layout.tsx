import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.scss";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "MasterQuiz — Stay curious", template: "%s | MasterQuiz" },
  description:
    "Explore geography, history, and science. Discover something new with every question on MasterQuiz.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions (Grammarly, LanguageTool) add attributes to <html>
    // and <body> before React loads. This only ignores those two tags'
    // own attributes, not their children.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
