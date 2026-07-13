"use client";

import type { Deck } from "../types";

/** #rrggbb → RRGGBB (pptxgenjs / jsPDF want no hash). */
export function hx(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// A tiny solid-colour JPEG data URL, used if a fetch ever fails so export
// never breaks (the deck degrades gracefully instead of crashing).
function solidFallback(hex: string): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, 8, 8);
  }
  return canvas.toDataURL("image/jpeg", 0.8);
}

function isBlobStoreUrl(src: string): boolean {
  try {
    return new URL(src).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

async function fetchAsDataUrl(src: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(src, { mode: "cors", signal: controller.signal });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await blobToDataUrl(await res.blob());
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch one image and return a base64 data URL (already-data URLs pass through). */
export async function toDataUrl(src: string, fallbackHex = "#d8cdbb"): Promise<string> {
  if (src.startsWith("data:")) return src;
  try {
    return await fetchAsDataUrl(src, 9000);
  } catch {
    // Library assets get a second chance through the same-origin proxy in case
    // a direct cross-origin fetch of the blob store is ever blocked.
    if (isBlobStoreUrl(src)) {
      try {
        return await fetchAsDataUrl(`/api/library/file?url=${encodeURIComponent(src)}`, 9000);
      } catch {
        /* fall through to the solid tile */
      }
    }
    // A slow, throttled, or failed image degrades to a solid palette tile so the
    // export always completes instead of hanging on one stuck request.
    return solidFallback(fallbackHex);
  }
}

export interface PreparedLogo {
  /** PNG data URL, transparency preserved */
  data: string;
  /** natural width ÷ height, for sizing the mark in exports */
  aspect: number;
}

/**
 * Normalise an uploaded logo to PNG and measure its aspect ratio. Uploads can be
 * any browser-renderable format (SVG, WEBP…), but jsPDF and PowerPoint only
 * reliably embed PNG/JPEG — re-rasterising through a canvas covers them all.
 * Returns null when there is no logo or it can't be decoded (export continues
 * with the text mark instead).
 */
export function prepareLogo(src: string | null | undefined): Promise<PreparedLogo | null> {
  return new Promise((resolve) => {
    if (!src || typeof document === "undefined") return resolve(null);
    const image = new Image();
    image.onload = () => {
      const w = image.naturalWidth || image.width;
      const h = image.naturalHeight || image.height;
      if (!w || !h) return resolve(null);
      // Render at up to 240px tall — far more than the ~0.35in mark needs.
      const scale = Math.min(1, 240 / h);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        resolve({ data: canvas.toDataURL("image/png"), aspect: w / h });
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/**
 * Resolve every image in a deck to a data URL up front, reporting progress.
 * Returns a Map keyed by the original src so slide builders can look them up.
 */
export async function resolveDeckImages(
  deck: Deck,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const srcs = new Set<string>();
  for (const slide of deck.slides) {
    switch (slide.kind) {
      case "cover":
      case "concept":
        srcs.add(slide.image.src);
        break;
      case "mood":
        slide.images.forEach((i) => srcs.add(i.src));
        break;
      case "space":
        srcs.add(slide.hero.src);
        slide.supporting.forEach((i) => srcs.add(i.src));
        break;
    }
  }
  const fallbackHex = deck.palette[0]?.hex ?? "#cfc7b8";
  const list = [...srcs];
  const map = new Map<string, string>();
  let done = 0;
  const total = list.length;
  // Small concurrency pool to keep exports fast without hammering the network.
  const CONCURRENCY = 8;
  let cursor = 0;
  async function worker() {
    while (cursor < list.length) {
      const i = cursor++;
      const src = list[i];
      map.set(src, await toDataUrl(src, fallbackHex));
      done++;
      onProgress?.(done, total);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker));
  return map;
}
