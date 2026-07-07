import type { StyleDirection } from "./types";

/**
 * The catalogue of design directions. Each one is a complete, coherent visual
 * identity — palette, materials, lighting and a design language — so that every
 * space in a generated deck reads as one direction rather than 15 unrelated
 * images (see PRD §9, style consistency).
 */
export const STYLE_DIRECTIONS: StyleDirection[] = [
  {
    id: "grounded-contemporary",
    name: "Grounded Contemporary",
    tagline: "Warm, tactile, quietly premium",
    axis: "Warm & grounded",
    mood: ["warm", "sophisticated", "inviting", "focused", "effortlessly premium"],
    palette: [
      { name: "Walnut", hex: "#5b3d2b" },
      { name: "Clay", hex: "#a9784f" },
      { name: "Oat", hex: "#e7dcc7" },
      { name: "Sage Olive", hex: "#7c7a55" },
      { name: "Warm Ink", hex: "#2c2620" },
    ],
    materials: [
      { name: "Walnut veneer", note: "warmth, richness, timeless elegance" },
      { name: "Fluted panelling", note: "depth, texture, architectural character" },
      { name: "Boucle & linen", note: "soft, residential comfort" },
      { name: "Brushed brass", note: "a restrained, luxurious accent" },
    ],
    lighting: "Layered warm ambient lighting with a hospitality-inspired glow",
    designLanguage: [
      { term: "Walnut wood veneers", effect: "create warmth, richness, and timeless elegance" },
      { term: "Fluted panel detailing", effect: "adds depth, texture, and architectural character" },
      { term: "Earth-toned palette", effect: "promotes comfort, focus, and visual harmony" },
      { term: "Integrated greenery", effect: "introduces a calming biophilic connection" },
      { term: "Warm ambient lighting", effect: "creates a hospitality-inspired atmosphere" },
      { term: "Premium material layering", effect: "delivers a luxurious yet approachable feel" },
    ],
    overlay: "rgba(74, 48, 30, 0.14)",
    imageMood: "warm natural light, walnut and earth tones, biophilic",
  },
  {
    id: "azure-refined",
    name: "Azure Refined",
    tagline: "Cool, calm, and precise",
    axis: "Cool & refined",
    mood: ["calm", "refined", "open", "relaxed", "composed"],
    palette: [
      { name: "Azure", hex: "#3b6ea5" },
      { name: "Deep Marine", hex: "#20344b" },
      { name: "Mist", hex: "#c3d3e2" },
      { name: "Soft Cloud", hex: "#eef2f6" },
      { name: "Slate Ink", hex: "#2a3138" },
    ],
    materials: [
      { name: "Matte white surfaces", note: "clean, light-filled calm" },
      { name: "Pale oak", note: "soft, natural warmth against cool blue" },
      { name: "Fabric acoustic panels", note: "quiet focus and comfort" },
      { name: "Fine metal detailing", note: "crisp, precise lines" },
    ],
    lighting: "Abundant daylight balanced with soft, even ambient light",
    designLanguage: [
      { term: "Soft blue palette", effect: "keeps the space feeling fresh, open, and unhurried" },
      { term: "Light oak accents", effect: "add gentle warmth without weight" },
      { term: "Minimal detailing", effect: "keeps every surface calm and uncluttered" },
      { term: "Natural daylight", effect: "makes the space feel airy and effortless" },
      { term: "Acoustic softening", effect: "supports focus and quiet conversation" },
      { term: "Balanced neutrals", effect: "let accents breathe and read intentional" },
    ],
    overlay: "rgba(30, 58, 95, 0.16)",
    imageMood: "cool daylight, soft blues, minimal and airy",
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    tagline: "Light, gallery-clean, considered",
    axis: "Light & minimal",
    mood: ["clean", "bright", "considered", "gallery-like", "uncluttered"],
    palette: [
      { name: "Chalk White", hex: "#f4f2ee" },
      { name: "Pale Oak", hex: "#d8c6a8" },
      { name: "Fog Grey", hex: "#b9b7b2" },
      { name: "Graphite", hex: "#3a3a38" },
      { name: "Matte Black", hex: "#1b1b1a" },
    ],
    materials: [
      { name: "Micro-cement", note: "seamless, monolithic calm" },
      { name: "Pale oak", note: "quiet natural grain" },
      { name: "Matte black metal", note: "precise, graphic accents" },
      { name: "Textured plaster", note: "subtle depth in a neutral field" },
    ],
    lighting: "Crisp, gallery-style lighting that flatters clean surfaces",
    designLanguage: [
      { term: "Restrained neutral palette", effect: "lets architecture and light lead" },
      { term: "Continuous surfaces", effect: "create a calm, monolithic backdrop" },
      { term: "Matte black lines", effect: "add graphic definition and structure" },
      { term: "Negative space", effect: "gives every object room to breathe" },
      { term: "Considered detailing", effect: "reads as quiet, deliberate craft" },
      { term: "Natural oak warmth", effect: "keeps minimalism human and inviting" },
    ],
    overlay: "rgba(40, 40, 38, 0.10)",
    imageMood: "bright minimal interiors, oak and white, lots of negative space",
  },
  {
    id: "bold-executive",
    name: "Bold Executive",
    tagline: "Dark, confident, boardroom-grade",
    axis: "Dark & sophisticated",
    mood: ["confident", "sophisticated", "dramatic", "grounded", "commanding"],
    palette: [
      { name: "Charcoal", hex: "#2a2b2b" },
      { name: "Forest", hex: "#2f4638" },
      { name: "Brass", hex: "#b08d4c" },
      { name: "Stone", hex: "#cbc4b6" },
      { name: "Near Black", hex: "#161616" },
    ],
    materials: [
      { name: "Smoked oak", note: "deep, grounded richness" },
      { name: "Fluted glass", note: "privacy with a soft glow" },
      { name: "Antique brass", note: "warmth and quiet authority" },
      { name: "Marble accents", note: "a note of enduring luxury" },
    ],
    lighting: "Focused, low-key lighting with warm brass highlights",
    designLanguage: [
      { term: "Deep tonal palette", effect: "projects confidence and permanence" },
      { term: "Smoked oak surfaces", effect: "bring richness and gravity to the space" },
      { term: "Brass detailing", effect: "adds warmth and understated luxury" },
      { term: "Dramatic lighting", effect: "sculpts the room and sets a premium mood" },
      { term: "Layered greens", effect: "soften the darkness and add life" },
      { term: "Refined symmetry", effect: "reads as composed and intentional" },
    ],
    overlay: "rgba(20, 26, 22, 0.22)",
    imageMood: "moody premium interiors, dark oak, brass, deep green",
  },
  {
    id: "biophilic-calm",
    name: "Biophilic Calm",
    tagline: "Natural, serene, human",
    axis: "Natural & serene",
    mood: ["serene", "natural", "restorative", "soft", "grounded"],
    palette: [
      { name: "Sage", hex: "#8a9a7b" },
      { name: "Terracotta", hex: "#bd6f4f" },
      { name: "Oat Linen", hex: "#e6ddcb" },
      { name: "Bark", hex: "#6a5238" },
      { name: "Deep Moss", hex: "#3f4a33" },
    ],
    materials: [
      { name: "Light timber", note: "natural warmth and grain" },
      { name: "Linen & jute", note: "soft, tactile, honest texture" },
      { name: "Living greenery", note: "air, calm, and biophilic connection" },
      { name: "Lime plaster", note: "gentle, breathable surfaces" },
    ],
    lighting: "Soft, diffuse daylight with warm evening ambience",
    designLanguage: [
      { term: "Abundant greenery", effect: "restores calm and connects to nature" },
      { term: "Natural timber", effect: "adds warmth, grain, and honesty" },
      { term: "Earthy sage & terracotta", effect: "ground the space in the natural world" },
      { term: "Tactile natural fabrics", effect: "invite comfort and slowness" },
      { term: "Diffuse daylight", effect: "keeps the mood soft and restorative" },
      { term: "Organic forms", effect: "soften edges and ease the eye" },
    ],
    overlay: "rgba(63, 74, 51, 0.16)",
    imageMood: "biophilic interiors, plants, sage and terracotta, natural timber",
  },
];

export const STYLE_BY_ID = new Map(STYLE_DIRECTIONS.map((s) => [s.id, s]));

export function getStyle(id: string): StyleDirection {
  return STYLE_BY_ID.get(id) ?? STYLE_DIRECTIONS[0];
}

export const BUDGET_TIERS: { id: "essential" | "signature" | "bespoke"; label: string; note: string }[] = [
  { id: "essential", label: "Essential", note: "Smart, cost-aware specification" },
  { id: "signature", label: "Signature", note: "Elevated materials and detailing" },
  { id: "bespoke", label: "Bespoke", note: "Fully custom, no compromises" },
];
