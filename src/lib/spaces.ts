import type { SpaceType } from "./types";

/**
 * The space checklist (PRD §4 step 2). The user selects which spaces exist in
 * the project and in what quantity; the deck is then structured around these
 * actual spaces. No layout parsing in v1.
 */
export const SPACE_TYPES: SpaceType[] = [
  {
    id: "reception",
    label: "Reception",
    category: "reception",
    summary: "First impression & waiting",
    purpose: "welcome visitors and set the tone for the whole space",
    feeling: ["welcoming", "calm", "confident", "memorable"],
    defaultQty: 1,
    common: true,
  },
  {
    id: "lounge",
    label: "Lounge / Breakout",
    category: "lounge",
    summary: "Informal seating & pause",
    purpose: "offer a relaxed place to pause, meet informally, and recharge",
    feeling: ["relaxed", "inviting", "social", "comfortable"],
    defaultQty: 1,
    common: true,
  },
  {
    id: "workstations",
    label: "Open Workstations",
    category: "workstation",
    summary: "Primary desking area",
    purpose: "support focused daily work across the team",
    feeling: ["productive", "clear", "energising", "organised"],
    defaultQty: 1,
    common: true,
  },
  {
    id: "meeting-room",
    label: "Meeting Room",
    category: "meeting",
    summary: "Small group discussions",
    purpose: "host focused discussions and quick collaboration",
    feeling: ["focused", "collaborative", "comfortable", "efficient"],
    defaultQty: 2,
    common: true,
  },
  {
    id: "conference-room",
    label: "Conference / Board Room",
    category: "conference",
    summary: "Formal presentations",
    purpose: "hold important presentations, negotiations, and decisions",
    feeling: ["refined", "impressive", "composed", "decisive"],
    defaultQty: 1,
    common: true,
  },
  {
    id: "private-cabin",
    label: "Private Cabin",
    category: "cabin",
    summary: "Manager / director office",
    purpose: "give leadership a calm, personal space for focused work",
    feeling: ["personal", "calm", "refined", "focused"],
    defaultQty: 2,
    common: true,
  },
  {
    id: "collaboration",
    label: "Collaboration Zone",
    category: "collaboration",
    summary: "Open teamwork & huddles",
    purpose: "encourage spontaneous teamwork and idea sharing",
    feeling: ["open", "creative", "dynamic", "connected"],
    defaultQty: 1,
    common: false,
  },
  {
    id: "cafeteria",
    label: "Cafeteria / Pantry",
    category: "cafeteria",
    summary: "Food, coffee & social",
    purpose: "bring people together over food and informal conversation",
    feeling: ["social", "warm", "lively", "welcoming"],
    defaultQty: 1,
    common: true,
  },
  {
    id: "wellness",
    label: "Wellness / Quiet Room",
    category: "wellness",
    summary: "Rest & focus retreat",
    purpose: "provide a quiet retreat for rest, focus, or a private call",
    feeling: ["serene", "restful", "private", "soft"],
    defaultQty: 1,
    common: false,
  },
  {
    id: "washroom",
    label: "Washroom",
    category: "washroom",
    summary: "Restroom finishes",
    purpose: "carry the design language through to every finish and fixture",
    feeling: ["clean", "refined", "considered", "premium"],
    defaultQty: 1,
    common: false,
  },
];

export const SPACE_BY_ID = new Map(SPACE_TYPES.map((s) => [s.id, s]));

export function getSpace(id: string): SpaceType | undefined {
  return SPACE_BY_ID.get(id);
}

/** The spaces pre-selected when the wizard first loads. */
export function defaultSelectedSpaces() {
  return SPACE_TYPES.filter((s) => s.common).map((s) => ({
    spaceId: s.id,
    quantity: s.defaultQty,
  }));
}
