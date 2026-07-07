import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import type { Deck, SpaceSlide, CoverSlide } from "@/lib/types";
import { getStyle } from "@/lib/styles";
import { fallbackGradient } from "@/lib/imagery";
import { ScaledSlide } from "@/components/deck/ScaledSlide";
import { DeckSlide } from "@/components/deck/DeckSlide";

export function Hero({ deck }: { deck: Deck }) {
  const cover = deck.slides.find((s) => s.kind === "cover") as CoverSlide;
  const space = deck.slides.find((s) => s.kind === "space") as SpaceSlide;
  const overlay = getStyle(deck.meta.styleId).overlay;
  const fallback = fallbackGradient(deck.palette);

  return (
    <section className="relative overflow-hidden pt-28 md:pt-36">
      <div className="paper-texture pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-clay-200/40 blur-3xl" />

      <div className="lf-container relative grid items-center gap-14 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28">
        <div className="min-w-0 animate-fade-up">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-clay-700 backdrop-blur sm:text-[11px] sm:tracking-[0.2em]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" /> For design-and-build &amp; interior studios
          </span>

          <h1 className="lf-serif mt-6 text-[clamp(2.2rem,7vw,4.6rem)] font-normal leading-[1.04] tracking-[-0.01em] text-ink [text-wrap:balance]">
            A presentation-ready{" "}
            <br className="hidden sm:block" />
            <span className="italic">look &amp; feel</span> — in under{" "}
            <br className="hidden sm:block" /> two minutes.
          </h1>

          <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-ink/65">
            Turn a client brief and a simple list of spaces into a personalised,
            space-by-space design direction your team can present today —
            structured around the project&rsquo;s actual rooms, exported to PPTX
            and PDF, ready to win the work.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/generate" className="btn-primary text-[15px]">
              Generate a deck <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sample" className="btn-ghost text-[15px]">
              See a live sample
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 text-[13px] text-ink/55">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-clay-600" /> Brief → deck in &lt; 2 min
            </span>
            <span className="hidden h-4 w-px bg-ink/15 sm:block" />
            <span className="hidden sm:inline">No 3D · No scraping · Fully editable</span>
          </div>
        </div>

        {/* Live output preview */}
        <div className="relative min-w-0 animate-fade-in [animation-delay:200ms]">
          <div className="relative mx-auto max-w-[520px]">
            <div className="absolute -right-4 top-10 w-[78%] rotate-[4deg] opacity-90 blur-[0.3px]">
              <ScaledSlide>
                <DeckSlide slide={space} overlay={overlay} fallback={fallback} />
              </ScaledSlide>
            </div>
            <div className="relative -rotate-[3deg]">
              <ScaledSlide>
                <DeckSlide slide={cover} overlay={overlay} fallback={fallback} />
              </ScaledSlide>
            </div>
          </div>
          <div className="mt-6 text-center">
            <span className="text-[11px] uppercase tracking-[0.2em] text-ink/40">
              Real output · generated from a brief
            </span>
          </div>
        </div>
      </div>

      {/* space marquee */}
      <div className="border-y border-ink/10 bg-sand/60">
        <div className="lf-container flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4 text-[12px] uppercase tracking-[0.22em] text-ink/45">
          {["Reception", "Lounge", "Workstations", "Meeting Rooms", "Board Room", "Cabins", "Cafeteria", "Wellness"].map(
            (s) => (
              <span key={s} className="inline-flex items-center gap-8">
                {s}
                <span className="h-1 w-1 rounded-full bg-clay-400" />
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
