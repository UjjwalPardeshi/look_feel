import type { Brief } from "../types";
import { buildDeck } from "./build";

/** A fixed, representative brief used for the marketing sample + /sample page. */
export const SAMPLE_BRIEF: Brief = {
  clientName: "Northwind Ventures",
  projectName: "Northwind HQ — Workplace Fit-out",
  industry: "Corporate office",
  styleId: "grounded-contemporary",
  budgetTier: "signature",
  brandColors: [],
  notes: "Warm, hospitality-led headquarters for a growing investment firm.",
  spaces: [
    { spaceId: "reception", quantity: 1 },
    { spaceId: "lounge", quantity: 1 },
    { spaceId: "workstations", quantity: 1 },
    { spaceId: "meeting-room", quantity: 2 },
    { spaceId: "conference-room", quantity: 1 },
    { spaceId: "private-cabin", quantity: 2 },
    { spaceId: "cafeteria", quantity: 1 },
  ],
};

// Fixed date so the sample deck is fully deterministic (no hydration drift).
const SAMPLE_DATE = new Date(Date.UTC(2026, 5, 9));

export function buildSampleDeck() {
  return buildDeck(SAMPLE_BRIEF, SAMPLE_DATE);
}
