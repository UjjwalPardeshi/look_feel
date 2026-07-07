import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { imageUrl, MARKETING } from "@/lib/imagery";
import { SmartImage } from "@/components/SmartImage";

export function CTA() {
  return (
    <section className="pb-24 md:pb-32">
      <div className="lf-container">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-paper md:px-16 md:py-20">
          <div className="absolute inset-0 opacity-25">
            <SmartImage src={imageUrl(MARKETING.hero, 1600, 700)} alt="Interior" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
          <div className="relative max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-clay-300">
              Win the next project faster
            </p>
            <h2 className="lf-serif mt-5 text-[clamp(2.1rem,4.5vw,3.6rem)] leading-[1.04]">
              Give your prospect a{" "}
              <span className="italic text-clay-200">personalised direction</span>{" "}
              — before your competitor even replies.
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-paper/65">
              Generate a complete, space-by-space look &amp; feel deck now. No sign-up,
              no setup — just a brief and a couple of minutes.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/generate" className="btn-primary !bg-paper !text-ink hover:!bg-clay-100 text-[15px]">
                Generate a deck <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sample" className="btn-ghost !border-paper/30 !text-paper hover:!bg-paper/10 text-[15px]">
                See a live sample
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
