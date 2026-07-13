import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DeckViewer } from "@/components/deck/DeckViewer";
import { ExportBar } from "@/components/deck/ExportBar";
import { PaletteRow } from "@/components/deck/PaletteRow";
import { buildSampleDeck } from "@/lib/deck/sample";
import { getStyle } from "@/lib/styles";

export const metadata: Metadata = {
  title: "Sample Deck — Look & Feel",
  description: "A complete, space-by-space look & feel deck generated from a brief.",
};

export default function SamplePage() {
  const deck = buildSampleDeck();
  const style = getStyle(deck.meta.styleId);

  return (
    <>
      <SiteNav />
      <main className="pt-24">
        <section className="border-b border-ink/10 bg-sand/50">
          <div className="lf-container py-12">
            <Link href="/" className="link-underline inline-flex items-center gap-2 text-[13px] text-ink/55 hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Back home
            </Link>
            <div className="mt-6 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-clay-700">
                  <Sparkles className="h-3.5 w-3.5" /> Sample output
                </span>
                <h1 className="lf-serif mt-5 text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.05] text-ink">
                  {deck.meta.project}
                </h1>
                <p className="mt-4 text-[16px] leading-relaxed text-ink/60">
                  A full, presentation-ready deck generated from the{" "}
                  <strong>{deck.meta.styleName}</strong>
                  {deck.meta.styleIds.length === 1 ? ` concept — ${style.tagline.toLowerCase()} —` : " concepts —"}{" "}
                  structured around this project&rsquo;s spaces. Download it as an
                  editable PowerPoint or a polished PDF.
                </p>
                <div className="mt-6">
                  <PaletteRow palette={deck.palette} size={30} gap={16} labels />
                </div>
              </div>
              <ExportBar deck={deck} className="no-print shrink-0" />
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="lf-container max-w-4xl">
            <DeckViewer deck={deck} />
          </div>
        </section>

        <section className="no-print border-t border-ink/10 bg-sand/50 py-16">
          <div className="lf-container flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <h2 className="lf-serif text-3xl text-ink">Your brief, your spaces.</h2>
              <p className="mt-2 text-[15px] text-ink/60">Generate the same quality for a real project in under two minutes.</p>
            </div>
            <Link href="/generate" className="btn-primary">Generate your own deck</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
