import type {
  Brief,
  Deck,
  DeckImage,
  Slide,
  SpaceSlide,
  Swatch,
} from "../types";
import { getStyle } from "../styles";
import { getSpace } from "../spaces";
import {
  imageUrl,
  pickForCategory,
  pickMood,
  pickCover,
} from "../imagery";
import {
  describeSpace,
  conceptNarrative,
  coverSubtitle,
  closingMessage,
  formatDeckDate,
} from "../copy";

const FIRM = "Studio Atelier";

/** Merge brand colours into the style palette without breaking coherence. */
export function buildPalette(styleId: string, brandColors: string[]): Swatch[] {
  const base = getStyle(styleId).palette;
  const brand = brandColors
    .filter((c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c))
    .slice(0, 2)
    .map((hex, i) => ({ name: i === 0 ? "Brand" : "Brand Accent", hex }));
  if (brand.length === 0) return base;
  // Brand accents lead; keep the rest of the direction behind them.
  return [...brand, ...base].slice(0, 6);
}

// Rotate a 4-swatch subset so each space slide has rhythm but stays on-palette.
function swatchSubset(palette: Swatch[], offset: number): Swatch[] {
  if (palette.length <= 4) return palette;
  const out: Swatch[] = [];
  for (let i = 0; i < 4; i++) out.push(palette[(offset + i) % palette.length]);
  return out;
}

function img(id: string, alt: string, w = 1200, h = 800): DeckImage {
  return { src: imageUrl(id, w, h), alt };
}

/**
 * Pure deck builder: (brief) → structured, space-by-space Deck model.
 * The exporters (PPTX / PDF) and the on-screen preview all consume this.
 */
export function buildDeck(brief: Brief, date: Date): Deck {
  const style = getStyle(brief.styleId);
  const palette = buildPalette(brief.styleId, brief.brandColors);
  const seed = `${brief.styleId}|${brief.projectName}|${brief.clientName}`;
  const dateLabel = formatDeckDate(date);
  const client = brief.clientName.trim() || "Prospective Client";
  const project = brief.projectName.trim() || "Interior Design Proposal";

  const slides: Slide[] = [];

  // 1. Cover
  slides.push({
    kind: "cover",
    firm: FIRM,
    title: project,
    subtitle: coverSubtitle(style),
    client,
    dateLabel,
    image: img(pickCover(seed), "Project cover imagery", 1600, 1000),
  });

  // Expand selected spaces into slide instances (respecting quantity).
  const spaceInstances: { space: ReturnType<typeof getSpace>; instance: number; total: number }[] = [];
  for (const sel of brief.spaces) {
    const space = getSpace(sel.spaceId);
    if (!space) continue;
    const qty = Math.max(1, Math.min(sel.quantity, 8));
    for (let n = 1; n <= qty; n++) {
      spaceInstances.push({ space, instance: n, total: qty });
    }
  }

  // 2. Contents
  const contentsItems = [
    { index: "01", label: "Design Concept" },
    { index: "02", label: "Mood & Materials" },
    { index: "03", label: "Look & Feel — Space by Space" },
    { index: "04", label: "Next Steps" },
  ];
  slides.push({ kind: "contents", items: contentsItems });

  // 3. Design Concept
  slides.push({
    kind: "concept",
    styleName: style.name,
    tagline: style.tagline,
    narrative: conceptNarrative(style, brief),
    designLanguage: style.designLanguage,
    palette,
    image: img(pickForCategory("lounge", style, 1, seed + "concept")[0], "Design concept imagery", 1200, 1400),
  });

  // 4. Mood & Materials
  slides.push({
    kind: "mood",
    title: "Mood & Materials",
    images: pickMood(seed, 6).map((id) => img(id, "Mood board reference", 700, 700)),
    palette,
    materials: style.materials,
  });

  // 5..N. Space-by-space
  let idx = 0;
  for (const { space, instance, total } of spaceInstances) {
    if (!space) continue;
    idx += 1;
    const instanceSeed = `${seed}|${space.id}|${instance}`;
    const ids = pickForCategory(space.category, style, 4, instanceSeed);
    const hero = img(ids[0], `${space.label} reference`, 1400, 950);
    const supporting = ids.slice(1, 4).map((id) => img(id, `${space.label} detail`, 700, 520));
    const qualifier = total > 1 ? `${space.label} ${String(instance).padStart(2, "0")}` : undefined;

    const slide: SpaceSlide = {
      kind: "space",
      name: space.label.toUpperCase(),
      category: space.category,
      qualifier,
      hero,
      supporting,
      description: describeSpace(space, style, instanceSeed),
      palette: swatchSubset(palette, idx),
      index: String(idx).padStart(2, "0"),
    };
    slides.push(slide);
  }

  // Last. Closing
  slides.push({
    kind: "closing",
    firm: FIRM,
    message: closingMessage(style),
    contact: "hello@studioatelier.design  ·  studioatelier.design",
  });

  return {
    meta: {
      firm: FIRM,
      client,
      project,
      industry: brief.industry,
      dateLabel,
      styleId: style.id,
      styleName: style.name,
      budgetTier: brief.budgetTier,
    },
    palette,
    slides,
  };
}

/** Count how many space slides a brief will yield (for UI hints). */
export function countSpaceSlides(brief: Brief): number {
  return brief.spaces.reduce((sum, s) => sum + Math.max(1, Math.min(s.quantity, 8)), 0);
}
