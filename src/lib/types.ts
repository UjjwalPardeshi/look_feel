// Core domain types for the Look & Feel Generator.
// Everything downstream (copy engine, deck builder, exporters, UI) depends on these.

export interface Swatch {
  /** Human-facing name, e.g. "Walnut" */
  name: string;
  /** Hex value, e.g. "#5b3d2e" */
  hex: string;
}

export interface Material {
  name: string;
  /** Short phrase describing what the material contributes */
  note: string;
}

export interface DesignLanguageItem {
  /** The design move, e.g. "Walnut wood veneers" */
  term: string;
  /** Its effect, e.g. "create warmth, richness, and timeless elegance" */
  effect: string;
}

export type BudgetTier = "essential" | "signature" | "bespoke";

/** A complete design direction (the "look & feel" identity of a deck). */
export interface StyleDirection {
  id: string;
  /** Display name, e.g. "Grounded Contemporary" */
  name: string;
  /** One-line positioning, e.g. "Warm, tactile, quietly premium" */
  tagline: string;
  /** The warm/cool/etc axis label used in the brief form */
  axis: string;
  /** Adjectives that seed the narrative */
  mood: string[];
  palette: Swatch[];
  materials: Material[];
  lighting: string;
  designLanguage: DesignLanguageItem[];
  /** rgba overlay applied to imagery to unify the deck's visual tone */
  overlay: string;
  /** keywords describing the imagery character */
  imageMood: string;
}

export type SpaceCategory =
  | "reception"
  | "lounge"
  | "workstation"
  | "meeting"
  | "conference"
  | "cabin"
  | "collaboration"
  | "cafeteria"
  | "washroom"
  | "wellness";

/** A space type that can appear in a project. */
export interface SpaceType {
  id: string;
  label: string;
  category: SpaceCategory;
  /** short descriptor used in the space checklist */
  summary: string;
  /** the human activity the space supports — seeds the copy engine */
  purpose: string;
  /** feeling verbs the copy engine draws on for this space */
  feeling: string[];
  /** default quantity when first added */
  defaultQty: number;
  /** whether this space is pre-selected in the wizard */
  common: boolean;
}

/** A space the user actually selected, with a quantity. */
export interface SelectedSpace {
  spaceId: string;
  quantity: number;
}

/** The full client brief captured by the wizard. */
export interface Brief {
  clientName: string;
  projectName: string;
  industry: string;
  styleId: string;
  budgetTier: BudgetTier;
  /** optional brand colours that augment the style palette */
  brandColors: string[];
  notes: string;
  spaces: SelectedSpace[];
}

// ---- Deck model (what the exporters consume) ----

export interface DeckImage {
  /** URL (remote) or data URL (uploaded/regenerated) */
  src: string;
  alt: string;
  /** true when the user swapped in their own image */
  userProvided?: boolean;
}

export interface CoverSlide {
  kind: "cover";
  firm: string;
  title: string;
  subtitle: string;
  client: string;
  dateLabel: string;
  image: DeckImage;
}

export interface ContentsSlide {
  kind: "contents";
  items: { index: string; label: string }[];
}

export interface ConceptSlide {
  kind: "concept";
  styleName: string;
  tagline: string;
  narrative: string[];
  designLanguage: DesignLanguageItem[];
  palette: Swatch[];
  image: DeckImage;
}

export interface MoodSlide {
  kind: "mood";
  title: string;
  images: DeckImage[];
  palette: Swatch[];
  materials: Material[];
}

export interface SpaceSlide {
  kind: "space";
  /** e.g. "RECEPTION" */
  name: string;
  /** category, so the UI can regenerate imagery from the right pool */
  category: SpaceCategory;
  /** e.g. "Meeting Room 02" when multiple exist */
  qualifier?: string;
  hero: DeckImage;
  supporting: DeckImage[];
  description: string;
  palette: Swatch[];
  index: string;
}

export interface ClosingSlide {
  kind: "closing";
  firm: string;
  message: string;
  contact: string;
}

export type Slide =
  | CoverSlide
  | ContentsSlide
  | ConceptSlide
  | MoodSlide
  | SpaceSlide
  | ClosingSlide;

export interface DeckMeta {
  firm: string;
  client: string;
  project: string;
  industry: string;
  dateLabel: string;
  styleId: string;
  styleName: string;
  budgetTier: BudgetTier;
}

export interface Deck {
  meta: DeckMeta;
  palette: Swatch[];
  slides: Slide[];
}
