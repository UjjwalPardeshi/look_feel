import type { ReactNode } from "react";
import type { Slide } from "@/lib/types";
import { SmartImage } from "@/components/SmartImage";
import { PaletteRow } from "./PaletteRow";

interface DeckSlideProps {
  slide: Slide;
  overlay?: string;
  fallback: string;
  /** edit controls overlaid on a space slide's hero (wizard only) */
  controls?: ReactNode;
}

const P = 56;

export function DeckSlide({ slide, overlay, fallback, controls }: DeckSlideProps) {
  const base = "absolute inset-0 h-full w-full";

  if (slide.kind === "cover") {
    return (
      <div className={`${base} bg-ink text-paper`}>
        <SmartImage src={slide.image.src} alt={slide.image.alt} fallback={fallback} priority className="absolute inset-0" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,17,13,0.45) 0%, rgba(20,17,13,0.15) 42%, rgba(20,17,13,0.82) 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: P }}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-[0.28em] text-[#f3ece1]">{slide.firm}</span>
            <span className="text-[11px] uppercase tracking-[0.28em] text-[#d8cbb6]">Design &amp; Build · Look &amp; Feel</span>
          </div>
          <div>
            <h1 className="lf-serif italic leading-[1.02]" style={{ fontSize: 66 }}>
              {slide.title}
            </h1>
            <p className="mt-4 text-[16px] tracking-wide text-[#ede4d5]">{slide.subtitle}</p>
            <div className="mt-7 h-[2px] w-[190px]" style={{ background: "#c9a24b" }} />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[12px] uppercase tracking-[0.24em] text-[#f3ece1]">Prepared for {slide.client}</span>
              <span className="text-[12px] tracking-[0.12em] text-[#f3ece1]">{slide.dateLabel}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slide.kind === "contents") {
    return (
      <div className={`${base} bg-paper text-ink`} style={{ padding: P }}>
        <p className="lf-eyebrow">Contents</p>
        <h2 className="lf-serif italic" style={{ fontSize: 46, marginTop: 8 }}>What&rsquo;s inside</h2>
        <div className="mt-10 space-y-0">
          {slide.items.map((it) => (
            <div key={it.index} className="flex items-center gap-6 border-b border-ink/10 py-5">
              <span className="lf-serif italic text-clay-500" style={{ fontSize: 30, width: 64 }}>/{it.index}</span>
              <span className="text-[22px] font-medium text-ink">{it.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.kind === "concept") {
    return (
      <div className={`${base} flex bg-paper text-ink`}>
        <div className="flex flex-1 flex-col" style={{ padding: P }}>
          <p className="lf-eyebrow">Design Concept</p>
          <h2 className="lf-serif italic leading-none" style={{ fontSize: 42, marginTop: 8 }}>{slide.styleName}</h2>
          <p className="mt-2 text-[15px] text-ink/60">{slide.tagline}</p>
          <div className="mt-5 space-y-3">
            {slide.narrative.map((p, i) => (
              <p key={i} className="text-[13.5px] leading-relaxed text-ink/70">{p}</p>
            ))}
          </div>
          <p className="lf-eyebrow mt-auto pt-5">Design Language</p>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2">
            {slide.designLanguage.map((d, i) => (
              <p key={i} className="text-[11px] leading-snug text-ink/70">
                <span className="font-semibold text-ink">{d.term}</span> {d.effect}
              </p>
            ))}
          </div>
          <div className="mt-5">
            <PaletteRow palette={slide.palette} size={26} gap={12} />
          </div>
        </div>
        <div className="relative h-full" style={{ width: 372 }}>
          <SmartImage src={slide.image.src} alt={slide.image.alt} fallback={fallback} overlay={overlay} className="h-full" />
        </div>
      </div>
    );
  }

  if (slide.kind === "mood") {
    return (
      <div className={`${base} bg-paper text-ink`} style={{ padding: P }}>
        <p className="lf-eyebrow">Mood &amp; Materials</p>
        <h2 className="lf-serif italic" style={{ fontSize: 38, marginTop: 6 }}>{slide.title}</h2>
        <div className="mt-6 flex gap-8">
          <div className="grid flex-1 grid-cols-3 gap-3">
            {slide.images.slice(0, 6).map((im, i) => (
              <div key={i} className="relative overflow-hidden rounded-[3px]" style={{ aspectRatio: "1 / 1" }}>
                <SmartImage src={im.src} alt={im.alt} fallback={fallback} overlay={overlay} />
              </div>
            ))}
          </div>
          <div style={{ width: 230 }}>
            <p className="lf-eyebrow">Palette</p>
            <div className="mt-3 space-y-2">
              {slide.palette.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="h-5 w-5 rounded-full ring-1 ring-black/5" style={{ background: s.hex }} />
                  <span className="text-[12px] text-ink/70">{s.name}</span>
                </div>
              ))}
            </div>
            <p className="lf-eyebrow mt-6">Materials</p>
            <div className="mt-3 space-y-2.5">
              {slide.materials.map((m, i) => (
                <p key={i} className="text-[11.5px] leading-snug text-ink/70">
                  <span className="font-semibold text-ink">{m.name}</span> — {m.note}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slide.kind === "space") {
    return (
      <div className={`${base} flex bg-paper text-ink`}>
        <div className="group relative h-full" style={{ width: 582 }}>
          <SmartImage src={slide.hero.src} alt={slide.hero.alt} fallback={fallback} overlay={overlay} className="h-full" />
          {controls}
        </div>
        <div className="flex flex-1 flex-col" style={{ padding: P, paddingLeft: 40 }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-clay-500">Look &amp; Feel /{slide.index}</p>
          <h2 className="lf-serif italic leading-tight" style={{ fontSize: 34, marginTop: 8 }}>{slide.name}</h2>
          {slide.qualifier && (
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-ink/45">{slide.qualifier}</p>
          )}
          <div className="mt-5">
            <PaletteRow palette={slide.palette} size={28} gap={13} />
          </div>
          <p className="mt-5 text-[13.5px] leading-relaxed text-ink/72">{slide.description}</p>
          <div className="mt-auto grid grid-cols-3 gap-2.5 pt-5">
            {slide.supporting.slice(0, 3).map((im, i) => (
              <div key={i} className="relative overflow-hidden rounded-[3px]" style={{ aspectRatio: "4 / 3" }}>
                <SmartImage src={im.src} alt={im.alt} fallback={fallback} overlay={overlay} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // closing
  return (
    <div className={`${base} bg-ink text-paper`} style={{ padding: P }}>
      <div className="flex h-full flex-col justify-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#c9a24b]">{slide.firm}</p>
        <h2 className="lf-serif italic leading-none" style={{ fontSize: 60, marginTop: 16 }}>Let&rsquo;s build it.</h2>
        <p className="mt-6 max-w-[560px] text-[15px] leading-relaxed text-[#ede4d5]">{slide.message}</p>
        <div className="mt-8 h-[2px] w-[160px]" style={{ background: "#c9a24b" }} />
        <p className="mt-4 text-[13px] tracking-[0.08em] text-[#f3ece1]">{slide.contact}</p>
      </div>
    </div>
  );
}
