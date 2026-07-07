import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Wizard } from "@/components/wizard/Wizard";

export const metadata: Metadata = {
  title: "Generate a Deck — Look & Feel",
  description:
    "Input a brief, define the project's spaces, and generate a presentation-ready look & feel deck in under two minutes.",
};

export default function GeneratePage() {
  return (
    <>
      <SiteNav />
      <main className="pt-24">
        <section className="border-b border-ink/10 bg-sand/40">
          <div className="lf-container py-10">
            <p className="lf-eyebrow">Look &amp; Feel Generator</p>
            <h1 className="lf-serif mt-3 text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] text-ink">
              From brief to boardroom.
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/60">
              Three quick steps. No sign-up, nothing to install — everything runs
              right here in your browser.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="lf-container max-w-5xl">
            <Wizard />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
