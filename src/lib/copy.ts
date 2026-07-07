import type { Brief, SpaceType, StyleDirection } from "./types";

/**
 * The copy engine. Turns a (style, space) pair into presentation-ready prose in
 * the voice of the reference decks — coherent across the whole deck because it
 * always draws on the same style vocabulary. Deterministic (seeded) so a deck
 * reads the same every time it is generated or exported.
 */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(seed: string, arr: T[]): T {
  return arr[hash(seed) % arr.length];
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A 3-sentence description of how a single space looks and feels. */
export function describeSpace(space: SpaceType, style: StyleDirection, seed: string): string {
  const feel = pick(seed + "a", space.feeling);
  const feel2 = pick(seed + "b", space.feeling.filter((f) => f !== feel));
  const mood = pick(seed + "c", style.mood);
  const p0 = style.palette[0].name.toLowerCase();
  const p1 = style.palette[2].name.toLowerCase();
  const mat = style.materials[0];
  const matName = mat.name.toLowerCase();

  const s1 = pick(seed + "s1", [
    `Designed to ${space.purpose}, the ${space.label.toLowerCase()} feels ${feel} and ${feel2} from the moment you arrive.`,
    `The ${space.label.toLowerCase()} is made to ${space.purpose} — ${feel}, ${feel2}, and quietly considered throughout.`,
    `Built to ${space.purpose}, this ${space.label.toLowerCase()} reads as ${feel} and ${feel2} the moment you step in.`,
  ]);

  const paletteEffect = pick(seed + "pe", [
    `keep the space ${mood} and balanced`,
    `give the room a ${mood}, cohesive base`,
    `ground the space in ${mood} calm`,
  ]);
  const s2 = `Tones of ${p0} and ${p1} ${paletteEffect}, while ${matName} brings ${mat.note}.`;

  const s3 = pick(seed + "s3", [
    `${style.lighting} keeps everything soft and uncluttered, and clean lines let the space feel modern without ever feeling cold.`,
    `${style.lighting} and restrained detailing keep the room calm and clear — premium, but genuinely comfortable to be in.`,
    `Layered textures and ${style.lighting.toLowerCase()} make the space feel finished and warm, never over-styled.`,
  ]);

  return `${s1} ${s2} ${s3}`;
}

/** The multi-paragraph design-concept narrative (deck's design summary). */
export function conceptNarrative(style: StyleDirection, brief: Brief): string[] {
  const sector = brief.industry.trim() ? brief.industry.trim().toLowerCase() : "workplace";
  const moods = list(style.mood.slice(0, 3));
  const materials = list(style.materials.slice(0, 3).map((m) => m.name.toLowerCase()));
  const palette = list(style.palette.slice(0, 3).map((p) => p.name.toLowerCase()));

  const p1 =
    `${style.name} is a ${moods} ${sector} environment inspired by natural materials, refined craftsmanship, and considered detail. ` +
    `The design balances professional function with genuine comfort, creating a setting that feels ${style.mood[0]}, ${style.mood[1]}, and effortlessly premium.`;

  const p2 =
    `The space draws from ${palette} tones, ${materials}, and layered texture to support well-being and focus. ` +
    `${cap(style.lighting)}, elegant furniture, and timeless materials come together to encourage collaboration, creativity, and long-term comfort across every area of the project.`;

  return [p1, p2];
}

export function coverSubtitle(style: StyleDirection): string {
  return `A ${style.tagline.toLowerCase()} design direction`;
}

export function closingMessage(style: StyleDirection): string {
  return `This ${style.name} direction is a starting point — a coherent visual language ready to carry through every space, refine together, and bring to life.`;
}

/** Short, human date label like "09 June 2026". */
export function formatDeckDate(d: Date): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
