import type { SpaceCategory, StyleDirection } from "./types";

/**
 * Curated interior imagery, verified and tagged by visual temperature so a deck
 * reads as one coherent direction. In the shipped product this pool is replaced
 * by the AI image-generation engine (PRD §4.1); here it is a robust, license-safe
 * stand-in that makes the whole pipeline demonstrable end-to-end.
 */

type Tone = "warm" | "cool" | "neutral";
interface Img {
  id: string;
  tone: Tone;
}

const CDN = "https://images.unsplash.com/photo-";

/** Build a sized, cropped Unsplash URL. */
export function imageUrl(id: string, w = 1200, h = 800, q = 72): string {
  return `${CDN}${id}?auto=format&fit=crop&w=${w}&h=${h}&q=${q}`;
}

const POOL: Record<SpaceCategory, Img[]> = {
  reception: [
    { id: "1497366412874-3415097a27e7", tone: "cool" },
    { id: "1524758631624-e2822e304c36", tone: "warm" },
    { id: "1618221195710-dd6b41faaea6", tone: "neutral" },
    { id: "1616486338812-3dadae4b4ace", tone: "neutral" },
    { id: "1600566753086-00f18fb6b3ea", tone: "warm" },
  ],
  lounge: [
    { id: "1556228453-efd6c1ff04f6", tone: "warm" },
    { id: "1600607687939-ce8a6c25118c", tone: "warm" },
    { id: "1567767292278-a4f21aa2d36e", tone: "neutral" },
    { id: "1522708323590-d24dbb6b0267", tone: "warm" },
    { id: "1554995207-c18c203602cb", tone: "warm" },
    { id: "1604328698692-f76ea9498e76", tone: "cool" },
  ],
  workstation: [
    { id: "1497366811353-6870744d04b2", tone: "cool" },
    { id: "1531973576160-7125cd663d86", tone: "cool" },
    { id: "1497215728101-856f4ea42174", tone: "neutral" },
    { id: "1524749292158-7540c2494485", tone: "neutral" },
    { id: "1497215842964-222b430dc094", tone: "cool" },
    { id: "1604328727766-a151d1045ab4", tone: "neutral" },
  ],
  meeting: [
    { id: "1571624436279-b272aff752b5", tone: "warm" },
    { id: "1517502884422-41eaead166d4", tone: "cool" },
    { id: "1541746972996-4e0b0f43e02a", tone: "cool" },
    { id: "1600880292203-757bb62b4baf", tone: "neutral" },
  ],
  conference: [
    { id: "1497366858526-0766cadbe8fa", tone: "warm" },
    { id: "1462826303086-329426d1aef5", tone: "cool" },
    { id: "1517502884422-41eaead166d4", tone: "cool" },
    { id: "1541746972996-4e0b0f43e02a", tone: "cool" },
  ],
  cabin: [
    { id: "1449247709967-d4461a6a6103", tone: "neutral" },
    { id: "1519974719765-e6559eac2575", tone: "neutral" },
    { id: "1615873968403-89e068629265", tone: "warm" },
    { id: "1594026112284-02bb6f3352fe", tone: "warm" },
  ],
  collaboration: [
    { id: "1556742049-0cfed4f6a45d", tone: "neutral" },
    { id: "1573167243872-43c6433b9d40", tone: "neutral" },
    { id: "1556761175-b413da4baf72", tone: "cool" },
    { id: "1568992687947-868a62a9f521", tone: "warm" },
    { id: "1604328727766-a151d1045ab4", tone: "neutral" },
  ],
  cafeteria: [
    { id: "1604014237800-1c9102c219da", tone: "warm" },
    { id: "1568992687947-868a62a9f521", tone: "warm" },
    { id: "1556228453-efd6c1ff04f6", tone: "warm" },
  ],
  washroom: [
    { id: "1604709177225-055f99402ea3", tone: "neutral" },
    { id: "1519974719765-e6559eac2575", tone: "neutral" },
  ],
  wellness: [
    { id: "1522771739844-6a9f6d5f14af", tone: "warm" },
    { id: "1594026112284-02bb6f3352fe", tone: "warm" },
    { id: "1519974719765-e6559eac2575", tone: "neutral" },
  ],
};

const MOOD_POOL: string[] = [
  "1600607687939-ce8a6c25118c",
  "1556228453-efd6c1ff04f6",
  "1524758631624-e2822e304c36",
  "1571624436279-b272aff752b5",
  "1567016432779-094069958ea5",
  "1594026112284-02bb6f3352fe",
  "1497032628192-86f99bcd76bc",
  "1604014237800-1c9102c219da",
  "1567767292278-a4f21aa2d36e",
  "1615873968403-89e068629265",
];

const COVER_POOL: string[] = [
  "1600585154340-be6161a56a0c",
  "1613490493576-7fde63acd811",
  "1524230572899-a752b3835840",
  "1600566753086-00f18fb6b3ea",
];

/** Named marketing images used across the landing page. */
export const MARKETING = {
  hero: "1600607687939-ce8a6c25118c",
  heroAlt: "1524758631624-e2822e304c36",
  process: "1503387762-592deb58ef4e",
  reception: "1497366412874-3415097a27e7",
  boardroom: "1497366858526-0766cadbe8fa",
  workstation: "1531973576160-7125cd663d86",
  lounge: "1556228453-efd6c1ff04f6",
  meeting: "1571624436279-b272aff752b5",
  collaborate: "1573167243872-43c6433b9d40",
  cafeteria: "1604014237800-1c9102c219da",
};

// Preferred image temperature per style, for visual coherence.
const STYLE_TONES: Record<string, Tone[]> = {
  "grounded-contemporary": ["warm", "neutral"],
  "azure-refined": ["cool", "neutral"],
  "modern-minimal": ["neutral", "cool"],
  "bold-executive": ["warm", "neutral"],
  "biophilic-calm": ["warm", "neutral"],
};

// Deterministic string hash → 32-bit int (so decks reproduce exactly on export).
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Public deterministic hash for seeded rotation elsewhere (e.g. library picks). */
export function seedHash(seed: string): number {
  return hash(seed);
}

function orderByTone(imgs: Img[], style: StyleDirection): Img[] {
  const prefs = STYLE_TONES[style.id] ?? ["neutral"];
  const rank = (t: Tone) => {
    const i = prefs.indexOf(t);
    return i === -1 ? prefs.length : i;
  };
  return [...imgs].sort((a, b) => rank(a.tone) - rank(b.tone));
}

/**
 * Pick `count` distinct image IDs for a space category, biased toward the
 * style's preferred tone and rotated deterministically by `seed`.
 */
export function pickForCategory(
  category: SpaceCategory,
  style: StyleDirection,
  count: number,
  seed: string,
): string[] {
  const pool = POOL[category] ?? POOL.workstation;
  const ordered = orderByTone(pool, style);
  const offset = hash(seed) % ordered.length;
  const out: string[] = [];
  for (let i = 0; i < ordered.length && out.length < count; i++) {
    const pick = ordered[(offset + i) % ordered.length].id;
    if (!out.includes(pick)) out.push(pick);
  }
  // If the pool is smaller than requested, top up allowing repeats.
  let i = 0;
  while (out.length < count && ordered.length > 0) {
    out.push(ordered[(offset + i) % ordered.length].id);
    i++;
  }
  return out;
}

/** All image URLs for a category (tone-ordered) — used by the edit loop to
 *  cycle through alternate references for a single space. */
export function categoryImageUrls(
  category: SpaceCategory,
  style: StyleDirection,
  w = 1400,
  h = 950,
): string[] {
  const pool = POOL[category] ?? POOL.workstation;
  return orderByTone(pool, style).map((im) => imageUrl(im.id, w, h));
}

export function pickMood(seed: string, count: number): string[] {
  const offset = hash(seed + "mood") % MOOD_POOL.length;
  const out: string[] = [];
  for (let i = 0; i < MOOD_POOL.length && out.length < count; i++) {
    out.push(MOOD_POOL[(offset + i) % MOOD_POOL.length]);
  }
  return out;
}

export function pickCover(seed: string): string {
  return COVER_POOL[hash(seed + "cover") % COVER_POOL.length];
}

/**
 * A CSS gradient derived from the style palette — used as a graceful fallback
 * when a photo fails to load, so the deck never shows a broken image.
 */
export function fallbackGradient(palette: { hex: string }[]): string {
  const stops = palette.slice(0, 3).map((s) => s.hex);
  while (stops.length < 3) stops.push("#c9c3b8");
  return `linear-gradient(135deg, ${stops[0]} 0%, ${stops[1]} 55%, ${stops[2]} 100%)`;
}
