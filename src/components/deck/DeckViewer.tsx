import type { ReactNode } from "react";
import type { Deck, SpaceSlide } from "@/lib/types";
import { getStyle } from "@/lib/styles";
import { fallbackGradient } from "@/lib/imagery";
import { ScaledSlide } from "./ScaledSlide";
import { DeckSlide } from "./DeckSlide";

export function DeckViewer({
  deck,
  renderSpaceControls,
}: {
  deck: Deck;
  renderSpaceControls?: (slide: SpaceSlide, index: number) => ReactNode;
}) {
  const defaultOverlay = getStyle(deck.meta.styleId).overlay;
  const fallback = fallbackGradient(deck.palette);

  return (
    <div className="space-y-6">
      {deck.slides.map((slide, i) => {
        // Multi-concept decks tint each slide with its own concept's overlay.
        const overlay =
          "styleId" in slide && slide.styleId
            ? getStyle(slide.styleId).overlay
            : defaultOverlay;
        return (
          <div key={i} className="group/slide relative">
            <div className="mb-2 flex items-center gap-3 px-1">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-ink/35">
                {String(i + 1).padStart(2, "0")} / {String(deck.slides.length).padStart(2, "0")}
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-ink/35">
                {slideLabel(slide)}
              </span>
              <span className="h-px flex-1 bg-ink/10" />
            </div>
            <div className="relative">
              <ScaledSlide>
                <DeckSlide slide={slide} overlay={overlay} fallback={fallback} brand={deck.meta.brand} />
              </ScaledSlide>
              {slide.kind === "space" && renderSpaceControls?.(slide, i)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function slideLabel(slide: Deck["slides"][number]): string {
  const opt = "optionLabel" in slide && slide.optionLabel ? `${slide.optionLabel} · ` : "";
  switch (slide.kind) {
    case "cover":
      return "Cover";
    case "contents":
      return "Contents";
    case "concept":
      return `${opt}Design Concept`;
    case "mood":
      return `${opt}Mood & Materials`;
    case "space":
      return `${opt}${slide.qualifier ?? slide.name}`;
    case "closing":
      return "Next Steps";
  }
}
