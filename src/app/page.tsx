import { Header } from "@/components/layout/Header";
import { Hero } from "@/features/home/components/Hero";
import { Benefits } from "@/features/home/components/Benefits";

export default function Home() {
  return (
    <>
      <Header activeHref="/" />
      <main>
        <Hero />
        <Benefits />
      </main>
    </>
  );
}
