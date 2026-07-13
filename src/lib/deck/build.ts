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
  seedHash,
} from "../imagery";
import type { LibraryImage } from "../library/types";
import {
  describeSpace,
  conceptNarrative,
  coverSubtitle,
  closingMessage,
  formatDeckDate,
} from "../copy";

const FIRM = "Look & Feel";

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
 * Library-first image selection for one space instance: reuse references from
 * the shared library (matching category + style) before falling back to the
 * built-in generator pool — the mechanic that amortises generation cost.
 * Deterministically rotated by seed so different clients get varied picks.
 */
function pickSpaceImages(
  category: SpaceSlide["category"],
  styleId: string,
  style: ReturnType<typeof getStyle>,
  count: number,
  instanceSeed: string,
  library: readonly LibraryImage[],
): string[] {
  const fromLibrary = library.filter(
    (li) => li.category === category && li.styleId === styleId,
  );
  const rotated: string[] = [];
  if (fromLibrary.length > 0) {
    const offset = seedHash(instanceSeed) % fromLibrary.length;
    for (let i = 0; i < fromLibrary.length; i++) {
      rotated.push(fromLibrary[(offset + i) % fromLibrary.length].url);
    }
  }
  const poolUrls = pickForCategory(category, style, count, instanceSeed).map((id) =>
    imageUrl(id, 1400, 950),
  );
  const out: string[] = [];
  for (const src of [...rotated, ...poolUrls]) {
    if (!out.includes(src)) out.push(src);
    if (out.length === count) break;
  }
  return out;
}

/**
 * Pure deck builder: (brief) → structured, space-by-space Deck model.
 * The exporters (PPTX / PDF) and the on-screen preview all consume this.
 * Pass the shared library's images to reuse existing references first.
 */
export function buildDeck(brief: Brief, date: Date, library: readonly LibraryImage[] = []): Deck {
  // Selected concepts in presentation order (Option A/B/C). Dedupe defensively;
  // an empty selection falls back to the default direction.
  const styleIds = [...new Set(brief.styleIds)].filter(Boolean);
  const styles = (styleIds.length > 0 ? styleIds : ["grounded-contemporary"]).map(getStyle);
  const multi = styles.length > 1;

  const primary = styles[0];
  const primaryPalette = buildPalette(primary.id, brief.brandColors);
  const dateLabel = formatDeckDate(date);
  const client = brief.clientName.trim() || "Prospective Client";
  const project = brief.projectName.trim() || "Interior Design Proposal";
  const baseSeed = `${project}|${client}`;
  // The client's mark rides on every slide; name falls back to the client name
  // so the deck is always co-branded even when nothing was uploaded.
  const brand = {
    name: brief.brandName.trim() || client,
    logo: brief.brandLogo,
  };

  const slides: Slide[] = [];

  // 1. Cover
  slides.push({
    kind: "cover",
    firm: FIRM,
    title: project,
    subtitle: coverSubtitle(styles),
    client,
    dateLabel,
    image: img(pickCover(`${primary.id}|${baseSeed}`), "Project cover imagery", 1600, 1000),
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
  const contentsItems = multi
    ? [
        ...styles.map((s, i) => ({
          index: String(i + 1).padStart(2, "0"),
          label: `Option ${String.fromCharCode(65 + i)} — ${s.name}`,
        })),
        { index: String(styles.length + 1).padStart(2, "0"), label: "Next Steps" },
      ]
    : [
        { index: "01", label: "Design Concept" },
        { index: "02", label: "Mood & Materials" },
        { index: "03", label: "Look & Feel — Space by Space" },
        { index: "04", label: "Next Steps" },
      ];
  slides.push({ kind: "contents", items: contentsItems });

  // 3..N. One full section per concept: concept → mood → space-by-space.
  for (let ci = 0; ci < styles.length; ci++) {
    const style = styles[ci];
    const optionLabel = multi ? `Option ${String.fromCharCode(65 + ci)}` : undefined;
    const palette = buildPalette(style.id, brief.brandColors);
    const seed = `${style.id}|${baseSeed}`;

    slides.push({
      kind: "concept",
      styleId: style.id,
      styleName: style.name,
      tagline: style.tagline,
      narrative: conceptNarrative(style, brief),
      designLanguage: style.designLanguage,
      palette,
      image: img(pickForCategory("lounge", style, 1, seed + "concept")[0], "Design concept imagery", 1200, 1400),
      optionLabel,
    });

    slides.push({
      kind: "mood",
      styleId: style.id,
      title: "Mood & Materials",
      images: pickMood(seed, 6).map((id) => img(id, "Mood board reference", 700, 700)),
      palette,
      materials: style.materials,
      optionLabel,
    });

    let idx = 0;
    for (const { space, instance, total } of spaceInstances) {
      if (!space) continue;
      idx += 1;
      const instanceSeed = `${seed}|${space.id}|${instance}`;
      const srcs = pickSpaceImages(space.category, style.id, style, 4, instanceSeed, library);
      const hero: DeckImage = { src: srcs[0], alt: `${space.label} reference` };
      const supporting: DeckImage[] = srcs
        .slice(1, 4)
        .map((src) => ({ src, alt: `${space.label} detail` }));
      const qualifier = total > 1 ? `${space.label} ${String(instance).padStart(2, "0")}` : undefined;

      const slide: SpaceSlide = {
        kind: "space",
        name: space.label.toUpperCase(),
        category: space.category,
        styleId: style.id,
        qualifier,
        hero,
        supporting,
        description: describeSpace(space, style, instanceSeed),
        palette: swatchSubset(palette, idx),
        index: String(idx).padStart(2, "0"),
        optionLabel,
      };
      slides.push(slide);
    }
  }

  // Last. Closing
  slides.push({
    kind: "closing",
    firm: FIRM,
    message: closingMessage(styles),
    contact: "hello@lookandfeel.studio  ·  lookandfeel.studio",
  });

  return {
    meta: {
      firm: FIRM,
      client,
      project,
      industry: brief.industry,
      dateLabel,
      styleId: primary.id,
      styleIds: styles.map((s) => s.id),
      styleName: styles.map((s) => s.name).join(" · "),
      budgetTier: brief.budgetTier,
      brand,
    },
    palette: primaryPalette,
    slides,
  };
}

/** Count how many space slides a brief will yield (for UI hints). */
export function countSpaceSlides(brief: Brief): number {
  return brief.spaces.reduce((sum, s) => sum + Math.max(1, Math.min(s.quantity, 8)), 0);
}
