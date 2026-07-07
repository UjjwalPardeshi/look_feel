"use client";

import type { Deck, Swatch } from "../types";
import { getStyle } from "../styles";
import { resolveDeckImages } from "./imageData";

// Work in a 1280×720 px (16:9) page. 96 px per inch, so layout numbers below are
// inches × 96 and font sizes are points × (96/72).
const U = 96;
const PW = 13.333 * U; // 1280
const PH = 7.5 * U; // 720
const M = 0.62 * U;

const INK: RGB = [28, 26, 23];
const SOFT: RGB = [74, 66, 58];
const MUTED: RGB = [138, 128, 117];
const PAPER: RGB = [251, 249, 245];
const LINE: RGB = [217, 207, 190];
const GOLD: RGB = [201, 162, 75];
const WHITE: RGB = [255, 255, 255];
const CREAM: RGB = [237, 228, 213];

type RGB = [number, number, number];
type Doc = import("jspdf").jsPDF;

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
// jsPDF sizes fonts in POINTS regardless of the page unit, so pass point sizes
// straight through. For manual vertical stacking we convert pt → px (96/72).
const PXPT = 96 / 72;
const fpx = (pt: number) => pt;
const adv = (pt: number, lh = 1.3) => pt * PXPT * lh;

/** Cover-crop a data URL to a target aspect and return a new JPEG data URL. */
function coverCrop(src: string, tw: number, th: number): Promise<string> {
  return new Promise((resolve) => {
    if (!src) return resolve("");
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = tw * scale;
      canvas.height = th * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(src);
      const ar = image.width / image.height;
      const target = tw / th;
      let sw = image.width, sh = image.height, sx = 0, sy = 0;
      if (ar > target) {
        sw = image.height * target;
        sx = (image.width - sw) / 2;
      } else {
        sh = image.width / target;
        sy = (image.height - sh) / 2;
      }
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => resolve("");
    image.src = src;
  });
}

function setFill(doc: Doc, c: RGB) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function setText(doc: Doc, c: RGB) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function eyebrow(doc: Doc, text: string, x: number, y: number, c: RGB = MUTED) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fpx(8.5));
  setText(doc, c);
  doc.text(spaced(text.toUpperCase()), x, y);
}
// jsPDF has no letter-spacing; fake it lightly for eyebrows.
function spaced(s: string): string {
  return s.split("").join(" ");
}

function swatchRow(doc: Doc, swatches: Swatch[], x: number, y: number, d = 27, gap = 40) {
  swatches.forEach((s, i) => {
    setFill(doc, hexToRgb(s.hex));
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.4);
    doc.circle(x + i * gap + d / 2, y + d / 2, d / 2, "FD");
  });
}

function para(doc: Doc, text: string, x: number, y: number, w: number, ptSize: number, c: RGB, lh = 1.35): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fpx(ptSize));
  setText(doc, c);
  const lines = doc.splitTextToSize(text, w) as string[];
  doc.setLineHeightFactor(lh);
  doc.text(lines, x, y, { baseline: "top" });
  return lines.length * adv(ptSize, lh);
}

/** Build a .pdf from the deck model and trigger a download. */
export async function exportPdf(
  deck: Deck,
  onProgress?: (label: string, pct: number) => void,
): Promise<void> {
  onProgress?.("Preparing imagery", 0.05);
  const images = await resolveDeckImages(deck, (done, total) => {
    onProgress?.("Rendering imagery", 0.05 + (done / Math.max(1, total)) * 0.5);
  });
  const raw = (src: string) => images.get(src) ?? "";

  onProgress?.("Assembling pages", 0.6);
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [PW, PH], hotfixes: ["px_scaling"] });
  const style = getStyle(deck.meta.styleId);
  const overlay = hexToRgb(style.palette[style.palette.length - 1].hex);

  let first = true;
  const page = () => {
    if (!first) doc.addPage([PW, PH], "landscape");
    first = false;
  };

  for (const s of deck.slides) {
    if (s.kind === "cover") {
      page();
      setFill(doc, INK);
      doc.rect(0, 0, PW, PH, "F");
      const img = await coverCrop(raw(s.image.src), PW, PH);
      if (img) doc.addImage(img, "JPEG", 0, 0, PW, PH);
      // legibility scrim
      setFill(doc, [10, 8, 6]);
      doc.saveGraphicsState();
      // @ts-expect-error GState typing
      doc.setGState(new doc.GState({ opacity: 0.42 }));
      doc.rect(0, 0, PW, PH, "F");
      doc.restoreGraphicsState();
      eyebrow(doc, s.firm, M, 0.75 * U, CREAM);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fpx(9));
      setText(doc, [216, 203, 182]);
      doc.text(spaced("DESIGN & BUILD  ·  LOOK & FEEL"), M, 1.05 * U);
      doc.setFont("times", "italic");
      doc.setFontSize(fpx(46));
      setText(doc, WHITE);
      doc.text(doc.splitTextToSize(s.title, PW - 2 * M) as string[], M, 3.7 * U, { baseline: "top" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fpx(14));
      setText(doc, CREAM);
      doc.text(s.subtitle, M, 5.55 * U, { baseline: "top" });
      setFill(doc, GOLD);
      doc.rect(M, 6.5 * U, 3.2 * U, 2, "F");
      doc.setFontSize(fpx(10));
      setText(doc, [243, 236, 225]);
      doc.text(spaced(`PREPARED FOR ${s.client.toUpperCase()}`), M, 6.72 * U, { baseline: "top" });
      doc.text(s.dateLabel, PW - M, 6.72 * U, { baseline: "top", align: "right" });
      continue;
    }

    if (s.kind === "contents") {
      page();
      setFill(doc, PAPER);
      doc.rect(0, 0, PW, PH, "F");
      eyebrow(doc, "Contents", M, 0.85 * U);
      doc.setFont("times", "italic");
      doc.setFontSize(fpx(34));
      setText(doc, INK);
      doc.text("What's inside", M, 1.15 * U, { baseline: "top" });
      s.items.forEach((it, i) => {
        const y = (2.75 + i * 1.0) * U;
        doc.setFont("times", "italic");
        doc.setFontSize(fpx(22));
        setText(doc, GOLD);
        doc.text(`/${it.index}`, M, y, { baseline: "top" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fpx(18));
        setText(doc, INK);
        doc.text(it.label, M + 1.35 * U, y + 3, { baseline: "top" });
        doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
        doc.setLineWidth(0.75);
        doc.line(M, y + 0.75 * U, M + 9.5 * U, y + 0.75 * U);
      });
      continue;
    }

    if (s.kind === "concept") {
      page();
      setFill(doc, PAPER);
      doc.rect(0, 0, PW, PH, "F");
      const imgW = 4.9 * U;
      const img = await coverCrop(raw(s.image.src), imgW, PH);
      if (img) doc.addImage(img, "JPEG", PW - imgW, 0, imgW, PH);
      const colW = PW - imgW - M - 0.5 * U;
      eyebrow(doc, "Design Concept", M, 0.72 * U);
      doc.setFont("times", "italic");
      doc.setFontSize(fpx(32));
      setText(doc, INK);
      doc.text(s.styleName, M, 1.05 * U, { baseline: "top" });
      para(doc, s.tagline, M, 1.82 * U, colW, 12.5, SOFT);
      let y = 2.35 * U;
      for (const p of s.narrative) {
        y += para(doc, p, M, y, colW, 11, SOFT, 1.3) + 12;
      }
      const dlY = Math.max(y + 8, 4.55 * U);
      eyebrow(doc, "Design Language", M, dlY);
      const half = Math.ceil(s.designLanguage.length / 2);
      const cols = [s.designLanguage.slice(0, half), s.designLanguage.slice(half)];
      cols.forEach((items, ci) => {
        let yy = dlY + 0.32 * U;
        const cx = M + ci * (colW / 2 + 6);
        items.forEach((it) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          setText(doc, INK);
          const termLines = doc.splitTextToSize(it.term, colW / 2 - 12) as string[];
          doc.text(termLines, cx, yy, { baseline: "top" });
          yy += termLines.length * adv(9.5, 1.15);
          doc.setFont("helvetica", "normal");
          setText(doc, SOFT);
          const effLines = doc.splitTextToSize(it.effect, colW / 2 - 12) as string[];
          doc.text(effLines, cx, yy, { baseline: "top" });
          yy += effLines.length * adv(9.5, 1.15) + 5;
        });
      });
      swatchRow(doc, s.palette, M, 6.85 * U, 26, 42);
      continue;
    }

    if (s.kind === "mood") {
      page();
      setFill(doc, PAPER);
      doc.rect(0, 0, PW, PH, "F");
      eyebrow(doc, "Mood & Materials", M, 0.72 * U);
      doc.setFont("times", "italic");
      doc.setFontSize(fpx(30));
      setText(doc, INK);
      doc.text(s.title, M, 1.05 * U, { baseline: "top" });
      const gx = M, gy = 2.0 * U, cw = 2.42 * U, ch = 2.42 * U, gap = 0.16 * U, cols = 3;
      for (let i = 0; i < Math.min(6, s.images.length); i++) {
        const r = Math.floor(i / cols), c = i % cols;
        const img = await coverCrop(raw(s.images[i].src), cw, ch);
        if (img) doc.addImage(img, "JPEG", gx + c * (cw + gap), gy + r * (ch + gap), cw, ch);
      }
      const sx = gx + cols * (cw + gap) + 0.35 * U;
      eyebrow(doc, "Palette", sx, 2.0 * U);
      swatchRow(doc, s.palette, sx, 2.28 * U, 30, 44);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fpx(9.5));
      s.palette.forEach((sw2, i) => {
        setText(doc, SOFT);
        doc.text(sw2.name, sx, (2.9 + i * 0.34) * U, { baseline: "top" });
      });
      const my = (2.9 + s.palette.length * 0.34 + 0.3) * U;
      eyebrow(doc, "Materials", sx, my);
      let yy = my + 0.32 * U;
      s.materials.forEach((mm) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        setText(doc, INK);
        doc.text(mm.name, sx, yy, { baseline: "top" });
        yy += adv(10, 1.25);
        doc.setFont("helvetica", "normal");
        setText(doc, SOFT);
        const l = doc.splitTextToSize(mm.note, PW - sx - M) as string[];
        doc.text(l, sx, yy, { baseline: "top" });
        yy += l.length * adv(10, 1.2) + 6;
      });
      continue;
    }

    if (s.kind === "space") {
      page();
      setFill(doc, PAPER);
      doc.rect(0, 0, PW, PH, "F");
      const heroW = 7.55 * U;
      const hero = await coverCrop(raw(s.hero.src), heroW, PH);
      if (hero) doc.addImage(hero, "JPEG", 0, 0, heroW, PH);
      const cx = heroW + 0.45 * U;
      const cw = PW - cx - M;
      eyebrow(doc, `Look & Feel  /${s.index}`, cx, 0.72 * U, GOLD);
      doc.setFont("times", "italic");
      doc.setFontSize(fpx(26));
      setText(doc, INK);
      doc.text(doc.splitTextToSize(s.name, cw) as string[], cx, 1.05 * U, { baseline: "top" });
      if (s.qualifier) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fpx(10.5));
        setText(doc, MUTED);
        doc.text(s.qualifier, cx, 1.95 * U, { baseline: "top" });
      }
      swatchRow(doc, s.palette, cx, 2.35 * U, 27, 42);
      para(doc, s.description, cx, 2.95 * U, cw, 11.5, SOFT, 1.32);
      const tw = (cw - 0.24 * U) / 3;
      for (let i = 0; i < Math.min(3, s.supporting.length); i++) {
        const img = await coverCrop(raw(s.supporting[i].src), tw, 1.05 * U);
        if (img) doc.addImage(img, "JPEG", cx + i * (tw + 0.12 * U), PH - 1.5 * U, tw, 1.05 * U);
      }
      continue;
    }

    if (s.kind === "closing") {
      page();
      setFill(doc, INK);
      doc.rect(0, 0, PW, PH, "F");
      setFill(doc, overlay);
      doc.saveGraphicsState();
      // @ts-expect-error GState typing
      doc.setGState(new doc.GState({ opacity: 0.14 }));
      doc.rect(0, 0, PW, PH, "F");
      doc.restoreGraphicsState();
      eyebrow(doc, s.firm, M, 1.25 * U, GOLD);
      doc.setFont("times", "italic");
      doc.setFontSize(fpx(44));
      setText(doc, WHITE);
      doc.text("Let's build it.", M, 2.0 * U, { baseline: "top" });
      para(doc, s.message, M, 3.4 * U, 8.6 * U, 13.5, CREAM, 1.35);
      setFill(doc, GOLD);
      doc.rect(M, 5.6 * U, 3 * U, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fpx(12));
      setText(doc, [243, 236, 225]);
      doc.text(s.contact, M, 5.8 * U, { baseline: "top" });
      continue;
    }
  }

  onProgress?.("Saving file", 0.95);
  const fileName = `${deck.meta.project.replace(/[^\w\s-]/g, "").trim() || "look-and-feel"} — Look & Feel.pdf`;
  doc.save(fileName);
  onProgress?.("Done", 1);
}
