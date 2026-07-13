"use client";

/**
 * Client-side text extraction from layout files. The file never leaves the
 * browser — a real selling point when the upload is a client's floor plan.
 *
 * - CAD-exported PDFs carry a text layer → read it directly (deterministic).
 * - Scanned PDFs (no usable text) → render pages at high resolution ("zoom in")
 *   and OCR them with tesseract.
 * - Images (PNG/JPG/WEBP) → OCR directly.
 */

export interface ExtractResult {
  text: string;
  method: "pdf-text" | "ocr";
  pages: number;
}

export type StatusCallback = (label: string) => void;

const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MAX_PDF_PAGES = 3;
/** target render width for OCR — plans are dense, so zoom well in */
const OCR_TARGET_WIDTH = 4400;
/** OCR runs on tiles of roughly this size so small labels stay legible */
const TILE_WIDTH = 2400;
const TILE_HEIGHT = 1900;
/** slight tile overlap so labels on a seam aren't cut — kept small to limit double counts */
const TILE_OVERLAP = 0.04;
/** below this many word characters, a PDF "text layer" is considered empty */
const MIN_TEXT_CHARS = 40;

function wordChars(s: string): number {
  return (s.match(/[A-Za-z]/g) ?? []).length;
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  // Worker is shipped as a static asset so bundler quirks can't break it.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

/** Split a large canvas into slightly overlapping tiles ("zooming in"). */
function tileCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement[] {
  const cols = Math.max(1, Math.ceil(canvas.width / TILE_WIDTH));
  const rows = Math.max(1, Math.ceil(canvas.height / TILE_HEIGHT));
  if (cols === 1 && rows === 1) return [canvas];
  const tileW = Math.ceil(canvas.width / cols);
  const tileH = Math.ceil(canvas.height / rows);
  const padX = Math.round(tileW * TILE_OVERLAP);
  const padY = Math.round(tileH * TILE_OVERLAP);
  const tiles: HTMLCanvasElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = Math.max(0, c * tileW - padX);
      const y = Math.max(0, r * tileH - padY);
      const w = Math.min(canvas.width - x, tileW + padX * 2);
      const h = Math.min(canvas.height - y, tileH + padY * 2);
      const tile = document.createElement("canvas");
      tile.width = w;
      tile.height = h;
      tile.getContext("2d")?.drawImage(canvas, x, y, w, h, 0, 0, w, h);
      tiles.push(tile);
    }
  }
  return tiles;
}

/**
 * OCR a plan canvas tile by tile with tesseract in sparse-text mode (labels on
 * a floor plan are scattered, not paragraphs). One worker is reused across
 * tiles to keep it fast.
 */
async function ocrCanvas(
  canvas: HTMLCanvasElement,
  onStatus?: StatusCallback,
): Promise<string> {
  onStatus?.("Reading labels (OCR)");
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const tiles = tileCanvas(canvas);
    let text = "";
    for (let i = 0; i < tiles.length; i++) {
      onStatus?.(
        tiles.length > 1
          ? `Zooming in · section ${i + 1}/${tiles.length}`
          : "Reading labels (OCR)",
      );
      const { data } = await worker.recognize(tiles[i]);
      text += " " + (data.text ?? "");
    }
    return text;
  } finally {
    await worker.terminate();
  }
}

async function pdfPageToCanvas(
  page: import("pdfjs-dist").PDFPageProxy,
): Promise<HTMLCanvasElement> {
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(6, Math.max(1, OCR_TARGET_WIDTH / base.width));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas;
}

async function extractFromPdf(file: File, onStatus?: StatusCallback): Promise<ExtractResult> {
  onStatus?.("Opening the plan");
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = Math.min(doc.numPages, MAX_PDF_PAGES);

  // 1st choice: the embedded text layer (CAD exports).
  let text = "";
  for (let n = 1; n <= pages; n++) {
    onStatus?.(pages > 1 ? `Reading text · page ${n}/${pages}` : "Reading the plan's text");
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ") + "\n";
  }
  if (wordChars(text) >= MIN_TEXT_CHARS) {
    return { text, method: "pdf-text", pages };
  }

  // Scanned plan: zoom in and OCR page by page.
  let ocrText = "";
  for (let n = 1; n <= pages; n++) {
    onStatus?.(pages > 1 ? `Zooming into page ${n}/${pages}` : "Zooming into the plan");
    const page = await doc.getPage(n);
    const canvas = await pdfPageToCanvas(page);
    ocrText += (await ocrCanvas(canvas, onStatus)) + "\n";
  }
  return { text: ocrText, method: "ocr", pages };
}

async function extractFromImage(file: File, onStatus?: StatusCallback): Promise<ExtractResult> {
  onStatus?.("Opening the plan");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(4, Math.max(1, OCR_TARGET_WIDTH / bitmap.width));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const text = await ocrCanvas(canvas, onStatus);
    return { text, method: "ocr", pages: 1 };
  } finally {
    bitmap.close();
  }
}

export async function extractLayoutText(
  file: File,
  onStatus?: StatusCallback,
): Promise<ExtractResult> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That file is over 30 MB — export a lighter PDF or image and retry.");
  }
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (isPdf) return extractFromPdf(file, onStatus);
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name)) {
    return extractFromImage(file, onStatus);
  }
  throw new Error("Unsupported file — upload the layout as a PDF or an image (PNG/JPG/WEBP).");
}
