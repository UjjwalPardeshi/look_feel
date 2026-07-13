import type { SelectedSpace } from "../types";
import { SPACE_TYPES } from "../spaces";

/**
 * Layout-plan space detection (PRD v2: "layout upload with automated space
 * detection"). Takes the raw text extracted from a floor plan (CAD-exported
 * PDF text layer, or OCR output for scanned plans/images) and maps room labels
 * onto the product's space catalogue — including quantities, seat counts (pax)
 * and the infrastructure that exists on the plan but doesn't belong in a deck.
 *
 * Deterministic and pure: same plan text in, same detection out.
 */

export interface DetectedSpace {
  spaceId: string;
  /** display label from the catalogue */
  label: string;
  quantity: number;
  /** e.g. "6–10 pax" or "20 pax" when the plan states capacities */
  detail?: string;
}

export interface LayoutDetection {
  /** ready to drop into Brief.spaces */
  selections: SelectedSpace[];
  /** same info, with labels/details for the UI */
  evidence: DetectedSpace[];
  /** found on the plan but not deck material, e.g. "Lifts ×10" */
  infrastructure: string[];
  /** e.g. "Eighth Floor Plan" when the sheet is titled */
  planTitle?: string;
  /** characters of plan text analysed (0 → nothing readable) */
  textLength: number;
}

type CountMode = "count" | "distinct-number" | "area";

interface SpaceRule {
  spaceId: string;
  /** matched against the normalised UPPERCASE text */
  pattern: RegExp;
  mode: CountMode;
  /** capture "N PAX" appearing shortly after each match */
  capturePax?: boolean;
  /** hard ceiling for this space's quantity */
  cap?: number;
}

// Vocabulary distilled from real Indian/international commercial floor plans
// (CAD exports label rooms in ALL CAPS: "MEETING ROOM 10 PAX", "EXECUTIVE
// CABIN - 3", "DRY PANTRY", "GENTS TOILET", …).
const SPACE_RULES: SpaceRule[] = [
  { spaceId: "reception", pattern: /\bRECEPTION\b/g, mode: "count", cap: 2 },
  {
    spaceId: "lounge",
    pattern: /\bWAITING\s+(?:AREA|LOUNGE)\b|\bLOUNGE\b|\bBREAK\s?-?\s?OUT\b/g,
    mode: "count",
    cap: 4,
  },
  {
    spaceId: "workstations",
    pattern:
      /\bWORK\s?STATIONS?\b|\bOPEN\s+(?:OFFICE|PLAN|WORK(?:ING)?(?:\s+AREA)?)\b|\bEXECUTIVE\s+AREA\b|\bDESK\s+AREA\b|\bLINEAR\s+W\/?S\b/g,
    mode: "area",
  },
  {
    spaceId: "meeting-room",
    pattern: /\bMEETING/g,
    mode: "count",
    capturePax: true,
  },
  {
    spaceId: "conference-room",
    pattern: /\bCONFERENCE(?:\s+ROOM)?\b|\bBOARD\s?ROOM\b/g,
    mode: "count",
    capturePax: true,
    cap: 3,
  },
  {
    spaceId: "private-cabin",
    pattern:
      /\b(?:EXECUTIVE\s+|MANAGER'?S?\s+|DIRECTOR'?S?\s+|MD\s+|CEO\s+)?CABINS?\b|\bMD\s+ROOM\b|\bDIRECTOR'?S?\s+(?:ROOM|OFFICE)\b/g,
    mode: "distinct-number",
  },
  {
    spaceId: "collaboration",
    pattern: /\bCOLLAB(?:ORATION)?(?:\s+(?:AREA|ZONE|SPACE))?\b|\bHUDDLE\b/g,
    mode: "count",
    cap: 4,
  },
  {
    spaceId: "cafeteria",
    pattern: /\bCAFETERIA\b|\bCAFE\b|\b(?:DRY\s+|WET\s+)?PANTRY\b|\bCANTEEN\b|\bBREAK\s?ROOM\b/g,
    mode: "count",
    capturePax: true,
    cap: 4,
  },
  {
    spaceId: "wellness",
    pattern:
      /\bWELLNESS\b|\bQUIET\s+ROOM\b|\bMOTHERS?\s+ROOM\b|\bCRECHE\b|\bMEDITATION\b|\bSICK\s?ROOM\b|\bNAP\s+ROOM\b/g,
    mode: "count",
    cap: 2,
  },
  {
    spaceId: "washroom",
    pattern: /\bTOILETS?\b|\bWASH\s?ROOMS?\b|\bREST\s?ROOMS?\b|\bPOWDER\s+ROOM\b|\bWC\b/g,
    mode: "count",
  },
];

// Present on plans, irrelevant to a look & feel deck — surfaced for transparency.
const INFRA_RULES: { label: string; pattern: RegExp }[] = [
  { label: "Lifts", pattern: /\bLIFTS?\b/g },
  { label: "Stairwells", pattern: /\bSTAIR(?:WELL|CASE)S?\b/g },
  { label: "Server room", pattern: /\bSERVER\s+ROOM\b/g },
  { label: "UPS room", pattern: /\bUPS\s+ROOM\b/g },
  { label: "Storage", pattern: /\bSTOR\s?AGE\b|\bSTORE\s+ROOM\b/g },
  { label: "Lobbies", pattern: /\bLOBBY\b/g },
  { label: "Ducts / shafts", pattern: /\bDUCT\b|\bSHAFT\b/g },
  { label: "Refuge / balcony", pattern: /\bREFUGE\b|\bBALCONY\b/g },
  { label: "AHU / electrical", pattern: /\bAHU\b|\bELECTRICAL\s+ROOM\b|\bE\.?D\.?\b/g },
];

const SPACE_ORDER = new Map(SPACE_TYPES.map((s, i) => [s.id, i]));
const SPACE_LABELS = new Map(SPACE_TYPES.map((s) => [s.id, s.label]));

const MAX_QTY = 8;

function normalise(raw: string): string {
  // CAD text often letter-spaces labels ("STOR AGE"); collapse whitespace only —
  // joining letters back up risks gluing unrelated words.
  return raw.toUpperCase().replace(/\s+/g, " ").trim();
}

/** "N PAX" appearing within `window` chars after `index`. */
function paxAfter(text: string, index: number, window = 28): number | undefined {
  const slice = text.slice(index, index + window);
  const m = /(\d{1,3})\s*PAX/.exec(slice);
  return m ? parseInt(m[1], 10) : undefined;
}

function paxSummary(paxes: number[]): string | undefined {
  const known = paxes.filter((p) => p > 0);
  if (known.length === 0) return undefined;
  const min = Math.min(...known);
  const max = Math.max(...known);
  return min === max ? `${min} pax` : `${min}–${max} pax`;
}

/**
 * OCR often garbles room-name words on dense CAD plans while the capacity
 * suffix ("ROOM 10 PAX") survives cleanly — count those as meeting rooms when
 * they aren't conference rooms.
 */
function meetingRoomsByCapacity(text: string): number {
  let count = 0;
  for (const m of text.matchAll(/ROOM\s*\d{1,2}\s*PAX/g)) {
    const before = text.slice(Math.max(0, m.index - 16), m.index);
    if (!/CONFERENCE|BOARD/.test(before)) count++;
  }
  return count;
}

export function detectSpacesFromText(raw: string): LayoutDetection {
  const text = normalise(raw);
  const capacityMeetings = meetingRoomsByCapacity(text);

  const evidence: DetectedSpace[] = [];
  for (const rule of SPACE_RULES) {
    const matches = [...text.matchAll(rule.pattern)];
    if (matches.length === 0 && !(rule.spaceId === "meeting-room" && capacityMeetings > 0)) continue;

    let quantity: number;
    if (rule.mode === "area") {
      quantity = 1;
    } else if (rule.mode === "distinct-number") {
      // "EXECUTIVE CABIN - 1 … CABIN - 4" → 4; unnumbered labels count singly.
      const numbers = new Set<string>();
      let unnumbered = 0;
      for (const m of matches) {
        const tail = /^\s*[-–]?\s*(\d{1,2})\b/.exec(text.slice(m.index + m[0].length, m.index + m[0].length + 8));
        if (tail) numbers.add(tail[1]);
        else unnumbered++;
      }
      quantity = numbers.size > 0 ? numbers.size : unnumbered;
    } else {
      quantity = matches.length;
    }
    if (rule.spaceId === "meeting-room") {
      quantity = Math.max(quantity, capacityMeetings);
    }

    quantity = Math.max(1, Math.min(quantity, rule.cap ?? MAX_QTY));

    let detail: string | undefined;
    if (rule.capturePax) {
      detail = paxSummary(
        matches
          .map((m) => paxAfter(text, m.index + m[0].length))
          .filter((p): p is number => p !== undefined),
      );
    }

    evidence.push({
      spaceId: rule.spaceId,
      label: SPACE_LABELS.get(rule.spaceId) ?? rule.spaceId,
      quantity,
      detail,
    });
  }

  evidence.sort(
    (a, b) => (SPACE_ORDER.get(a.spaceId) ?? 99) - (SPACE_ORDER.get(b.spaceId) ?? 99),
  );

  const infrastructure: string[] = [];
  for (const rule of INFRA_RULES) {
    const n = [...text.matchAll(rule.pattern)].length;
    if (n > 0) infrastructure.push(n > 1 ? `${rule.label} ×${n}` : rule.label);
  }

  const titleMatch =
    /\b((?:GROUND|FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH|THIRTEENTH|FOURTEENTH|FIFTEENTH|\d{1,3}(?:ST|ND|RD|TH)?|TYPICAL|MEZZANINE|BASEMENT|PODIUM|TERRACE)\s+FLOOR)\s+PLAN\b/.exec(
      text,
    );
  const planTitle = titleMatch
    ? `${titleMatch[1]} Plan`.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : undefined;

  return {
    selections: evidence.map((e) => ({ spaceId: e.spaceId, quantity: e.quantity })),
    evidence,
    infrastructure,
    planTitle,
    textLength: text.length,
  };
}
