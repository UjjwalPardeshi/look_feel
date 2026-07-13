import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Deck } from "@/lib/types";
import { getStyle } from "@/lib/styles";
import { fallbackGradient } from "@/lib/imagery";
import { ScaledSlide } from "@/components/deck/ScaledSlide";
import { DeckSlide } from "@/components/deck/DeckSlide";

export function SampleShowcase({ deck }: { deck: Deck }) {
  const overlay = getStyle(deck.meta.styleId).overlay;
  const fallback = fallbackGradient(deck.palette);

  // A representative spread: concept, mood, and two space slides.
  const picks = [
    deck.slides.find((s) => s.kind === "concept"),
    deck.slides.find((s) => s.kind === "mood"),
    deck.slides.filter((s) => s.kind === "space")[0],
    deck.slides.filter((s) => s.kind === "space")[3],
  ].filter(Boolean) as Deck["slides"];

  return (
    <section id="sample" className="scroll-mt-24 py-24 md:py-32">
      <div className="lf-container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="lf-eyebrow">Sample output</p>
            <h2 className="lf-serif mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.08] text-ink">
              This is what your client{" "}
              <span className="italic text-clay-700">actually receives.</span>
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-ink/60">
              A real deck generated from the <strong>{deck.meta.styleName}</strong>{" "}
              direction for a {deck.meta.industry.toLowerCase()} — structured around
              its own spaces, coherent from cover to close.
            </p>
          </div>
          <Link href="/sample" className="btn-ghost shrink-0">
            View the full deck <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {picks.map((slide, i) => (
            <ScaledSlide key={i}>
              <DeckSlide slide={slide} overlay={overlay} fallback={fallback} brand={deck.meta.brand} />
            </ScaledSlide>
          ))}
        </div>
      </div>
    </section>
  );
}
