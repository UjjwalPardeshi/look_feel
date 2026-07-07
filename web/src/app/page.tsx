import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SampleShowcase } from "@/components/landing/SampleShowcase";
import { Features } from "@/components/landing/Features";
import { Metrics } from "@/components/landing/Metrics";
import { CTA } from "@/components/landing/CTA";
import { buildSampleDeck } from "@/lib/deck/sample";

export default function HomePage() {
  const deck = buildSampleDeck();

  return (
    <>
      <SiteNav />
      <main>
        <Hero deck={deck} />
        <Problem />
        <HowItWorks />
        <SampleShowcase deck={deck} />
        <Features />
        <Metrics />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}
