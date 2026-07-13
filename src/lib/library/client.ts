"use client";

import type { Deck } from "../types";
import type {
  IngestItem,
  IngestResponse,
  LibraryImage,
  LibraryListResponse,
} from "./types";

/** Client-side API for the shared reference library. Every call degrades
 *  gracefully when the Blob store is not configured — the app keeps working
 *  from the built-in reference pool. */

const EMPTY: LibraryListResponse = { configured: false, images: [] };

export async function fetchLibrary(timeoutMs = 6000): Promise<LibraryListResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/library", { signal: controller.signal });
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as LibraryListResponse;
    return {
      configured: Boolean(data.configured),
      images: Array.isArray(data.images) ? data.images : [],
    };
  } catch {
    return EMPTY;
  } finally {
    clearTimeout(timer);
  }
}

async function postItems(items: IngestItem[]): Promise<IngestResponse> {
  const res = await fetch("/api/library", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(`ingest failed: ${res.status}`);
  return (await res.json()) as IngestResponse;
}

/**
 * Save every space reference used by a deck into the library ("generated"
 * source). Deduped server-side, so re-ingesting a deck is effectively free.
 * Returns the number of images newly added.
 */
export async function ingestDeck(deck: Deck): Promise<number> {
  const items: IngestItem[] = [];
  const seen = new Set<string>();
  for (const slide of deck.slides) {
    if (slide.kind !== "space") continue;
    for (const img of [slide.hero, ...slide.supporting]) {
      // Only remote generator output; user uploads are ingested at swap time.
      if (img.src.startsWith("data:") || seen.has(img.src)) continue;
      seen.add(img.src);
      items.push({
        url: img.src,
        category: slide.category,
        // Tag with the slide's own concept — decks can hold several.
        styleId: slide.styleId,
        source: "generated",
      });
    }
  }
  if (items.length === 0) return 0;
  let added = 0;
  // Chunk to stay well under the API's per-request cap.
  for (let i = 0; i < items.length; i += 50) {
    const res = await postItems(items.slice(i, i + 50));
    if (!res.configured) return 0;
    added += res.added.length;
  }
  return added;
}

/**
 * Store a designer-uploaded image in the library and return it. Returns
 * undefined when the library is not configured (caller falls back to a local
 * data URL so the swap still works).
 */
export async function uploadToLibrary(
  dataUrl: string,
  category: string,
  styleId: string,
): Promise<LibraryImage | undefined> {
  try {
    const res = await postItems([
      { dataUrl, category: category as IngestItem["category"], styleId, source: "uploaded" },
    ]);
    if (!res.configured) return undefined;
    return res.added[0] ?? res.existing[0];
  } catch {
    return undefined;
  }
}

export type DeleteResult = "ok" | "unauthorized" | "error";

export async function deleteFromLibrary(pathname: string, adminToken?: string): Promise<DeleteResult> {
  try {
    const res = await fetch("/api/library", {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        ...(adminToken ? { "x-library-token": adminToken } : {}),
      },
      body: JSON.stringify({ pathname }),
    });
    if (res.status === 401) return "unauthorized";
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

/**
 * Downscale + re-encode an image file to a library-friendly JPEG data URL
 * (max 1600px, ~85% quality) so uploads stay small and consistent.
 */
export function compressImage(file: File, maxDim = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
      fn();
    };
    // Decode can silently stall on exotic/corrupt files — never hang the UI.
    const timer = window.setTimeout(
      () => settle(() => reject(new Error("image decode timed out"))),
      15000,
    );
    img.onload = () =>
      settle(() => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      });
    img.onerror = () => settle(() => reject(new Error("could not read image")));
    img.src = url;
  });
}
