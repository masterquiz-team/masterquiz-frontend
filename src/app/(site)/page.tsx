import { SectionScroll } from "@/components/layout/Navigation";
import { Hero } from "@/features/home/components/Hero";
import { Benefits } from "@/features/home/components/Benefits";

import { JoinCommunity } from "@/features/home/components/JoinCommunity";

export default function Home() {
  return (
    <main>
      <Hero />
      <Benefits />
      <JoinCommunity />
      <SectionScroll />
    </main>
  );
}
