import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";

export const metadata: Metadata = {
  title: "Reference Library — Look & Feel",
  description:
    "Every generated and uploaded reference, organised by space and reused across clients — so imagery is generated once, not per deck.",
};

export default function LibraryPage() {
  return (
    <>
      <SiteNav />
      <main className="pt-24">
        <section className="border-b border-ink/10 bg-sand/40">
          <div className="lf-container py-10">
            <p className="lf-eyebrow">Reference Library</p>
            <h1 className="lf-serif mt-3 text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] text-ink">
              Generate once. Reuse forever.
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/60">
              Every reference from every deck lands here, organised by space. New
              decks pull from this library first — so the more you use it, the
              less you spend on generation.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-14">
          <div className="lf-container">
            <LibraryBrowser />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
