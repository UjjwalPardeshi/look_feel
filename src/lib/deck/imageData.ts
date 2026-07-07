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

/** Fetch one image and return a base64 data URL (already-data URLs pass through). */
export async function toDataUrl(src: string, fallbackHex = "#d8cdbb"): Promise<string> {
  if (src.startsWith("data:")) return src;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(src, { mode: "cors", signal: controller.signal });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    // A slow, throttled, or failed image degrades to a solid palette tile so the
    // export always completes instead of hanging on one stuck request.
    return solidFallback(fallbackHex);
  } finally {
    clearTimeout(timer);
  }
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
