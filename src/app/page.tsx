import { Header } from "@/components/layout/Header";
import { Hero } from "@/features/home/components/Hero";
import { Benefits } from "@/features/home/components/Benefits";
import { Footer } from "@/components/layout/Footer";

import { JoinCommunity } from "@/features/home/components/JoinCommunity";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Benefits />
        <JoinCommunity />
      </main>

      <Footer />
    </>
  );
}
