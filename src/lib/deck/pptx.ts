"use client";

import type { Deck, Swatch } from "../types";
import { getStyle } from "../styles";
import { hx, prepareLogo, resolveDeckImages } from "./imageData";

// 16:9 canvas in inches.
const W = 13.333;
const H = 7.5;
const M = 0.62;

const INK = "1C1A17";
const SOFT = "4A423A";
const MUTED = "8A8075";
const PAPER = "FBF9F5";
const SAND = "F1EADD";
const LINE = "D9CFBE";
const SERIF = "Georgia";
const SANS = "Arial";

type Pptx = InstanceType<Awaited<typeof import("pptxgenjs")>["default"]>;
type Slide = ReturnType<Pptx["addSlide"]>;

function swatchRow(pptx: Pptx, slide: Slide, swatches: Swatch[], x: number, y: number, d = 0.3, gap = 0.42) {
  swatches.forEach((s, i) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + i * gap,
      y,
      w: d,
      h: d,
      fill: { color: hx(s.hex) },
      line: { color: "FFFFFF", width: 1.25 },
    });
  });
}

function eyebrow(slide: Slide, text: string, x: number, y: number, color = MUTED, w = 6) {
  slide.addText(text.toUpperCase(), {
    x, y, w, h: 0.3,
    fontFace: SANS, fontSize: 9.5, color, bold: true, charSpacing: 3, align: "left",
  });
}

/** Build a .pptx from the deck model and trigger a download. */
export async function exportPptx(
  deck: Deck,
  onProgress?: (label: string, pct: number) => void,
): Promise<void> {
  onProgress?.("Preparing imagery", 0.05);
  const images = await resolveDeckImages(deck, (done, total) => {
    onProgress?.("Rendering imagery", 0.05 + (done / Math.max(1, total)) * 0.55);
  });
  const data = (src: string) => images.get(src) ?? "";

  onProgress?.("Assembling slides", 0.65);
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "LF", width: W, height: H });
  pptx.layout = "LF";
  pptx.author = deck.meta.firm;
  pptx.title = `${deck.meta.project} — Look & Feel`;

  const style = getStyle(deck.meta.styleId);
  const overlayColor = hx(style.palette[style.palette.length - 1].hex);

  const logo = await prepareLogo(deck.meta.brand?.logo);
  const brandName = deck.meta.brand?.name.trim() ?? "";

  // Stamp the client's mark top-right on a slide: logo when uploaded, name text
  // otherwise. On dark slides the logo sits on a paper plate so it stays legible.
  function brandMark(
    slide: Slide,
    opts: { y?: number; right?: number; dark?: boolean; h?: number } = {},
  ) {
    const right = opts.right ?? W - M;
    const y = opts.y ?? 0.66;
    if (logo) {
      let h = opts.h ?? 0.3;
      let w = h * logo.aspect;
      if (w > 1.6) {
        w = 1.6;
        h = w / logo.aspect;
      }
      if (opts.dark) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: right - w - 0.12,
          y: y - 0.08,
          w: w + 0.24,
          h: h + 0.16,
          fill: { color: PAPER },
          line: { color: PAPER, width: 0.5 },
          rectRadius: 0.04,
        });
      }
      slide.addImage({ data: logo.data, x: right - w, y, w, h });
    } else if (brandName) {
      slide.addText(brandName.toUpperCase(), {
        x: right - 4,
        y: y - 0.04,
        w: 4,
        h: 0.3,
        fontFace: SANS,
        fontSize: 9.5,
        bold: true,
        charSpacing: 2,
        color: opts.dark ? "EDE4D5" : MUTED,
        align: "right",
      });
    }
  }

  for (const s of deck.slides) {
    const slide = pptx.addSlide();

    if (s.kind === "cover") {
      slide.background = { color: INK };
      if (data(s.image.src)) {
        slide.addImage({ data: data(s.image.src), x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H } });
      }
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: INK, transparency: 42 } });
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: H - 3.4, w: W, h: 3.4, fill: { color: INK, transparency: 20 } });
      eyebrow(slide, s.firm, M, 0.6, "F3ECE1");
      slide.addText("DESIGN & BUILD  ·  LOOK & FEEL", {
        x: M, y: 0.94, w: 8, h: 0.3, fontFace: SANS, fontSize: 9, color: "D8CBB6", charSpacing: 3,
      });
      slide.addText(s.title, {
        x: M, y: 3.5, w: 10.5, h: 1.9, fontFace: SERIF, fontSize: 46, color: "FFFFFF", italic: true, align: "left", valign: "bottom",
      });
      slide.addText(s.subtitle, {
        x: M, y: 5.5, w: 9, h: 0.4, fontFace: SANS, fontSize: 14, color: "EDE4D5",
      });
      slide.addShape(pptx.ShapeType.line, { x: M, y: 6.5, w: 3.2, h: 0, line: { color: "C9A24B", width: 1.5 } });
      slide.addText(`PREPARED FOR ${s.client.toUpperCase()}`, {
        x: M, y: 6.7, w: 8, h: 0.3, fontFace: SANS, fontSize: 10, color: "F3ECE1", charSpacing: 2,
      });
      slide.addText(s.dateLabel, {
        x: W - 4.5, y: 6.7, w: 3.88, h: 0.3, fontFace: SANS, fontSize: 10, color: "F3ECE1", align: "right", charSpacing: 1,
      });
      brandMark(slide, { y: 0.55, dark: true, h: 0.34 });
      continue;
    }

    slide.background = { color: PAPER };

    if (s.kind === "contents") {
      eyebrow(slide, "Contents", M, 0.75);
      slide.addText("What's inside", {
        x: M, y: 1.1, w: 8, h: 0.9, fontFace: SERIF, fontSize: 34, color: INK, italic: true,
      });
      s.items.forEach((it, i) => {
        const y = 2.7 + i * 1.0;
        slide.addText(`/${it.index}`, { x: M, y, w: 1.2, h: 0.6, fontFace: SERIF, fontSize: 22, color: "C9A24B", italic: true });
        slide.addText(it.label, { x: M + 1.3, y: y + 0.03, w: 8, h: 0.6, fontFace: SANS, fontSize: 18, color: INK });
        slide.addShape(pptx.ShapeType.line, { x: M, y: y + 0.75, w: 9.5, h: 0, line: { color: LINE, width: 0.75 } });
      });
      brandMark(slide, { y: 0.7 });
      continue;
    }

    if (s.kind === "concept") {
      const imgW = 4.9;
      if (data(s.image.src)) {
        slide.addImage({ data: data(s.image.src), x: W - imgW, y: 0, w: imgW, h: H, sizing: { type: "cover", w: imgW, h: H } });
      }
      const colW = W - imgW - M - 0.5;
      eyebrow(slide, "Design Concept", M, 0.7);
      slide.addText(s.styleName, { x: M, y: 1.02, w: colW, h: 0.8, fontFace: SERIF, fontSize: 32, color: INK, italic: true });
      slide.addText(s.tagline, { x: M, y: 1.85, w: colW, h: 0.4, fontFace: SANS, fontSize: 12.5, color: SOFT });
      slide.addText(s.narrative.join("\n\n"), {
        x: M, y: 2.4, w: colW, h: 2.15, fontFace: SANS, fontSize: 11.5, color: SOFT, lineSpacingMultiple: 1.25, valign: "top", paraSpaceAfter: 8,
      });
      eyebrow(slide, "Design Language", M, 4.75);
      const half = Math.ceil(s.designLanguage.length / 2);
      const cols = [s.designLanguage.slice(0, half), s.designLanguage.slice(half)];
      cols.forEach((items, ci) => {
        const runs = items.flatMap((it) => [
          { text: `${it.term}  `, options: { bold: true, color: INK, fontSize: 10 } },
          { text: `${it.effect}\n`, options: { color: SOFT, fontSize: 10 } },
        ]);
        slide.addText(runs, {
          x: M + ci * (colW / 2 + 0.1), y: 5.1, w: colW / 2 - 0.1, h: 1.4, fontFace: SANS, lineSpacingMultiple: 1.15, valign: "top",
        });
      });
      swatchRow(pptx, slide, s.palette, M, 6.75, 0.3, 0.44);
      brandMark(slide, { right: W - imgW - 0.3, y: 0.66 });
      continue;
    }

    if (s.kind === "mood") {
      eyebrow(slide, "Mood & Materials", M, 0.7);
      slide.addText(s.title, { x: M, y: 1.02, w: 7, h: 0.7, fontFace: SERIF, fontSize: 30, color: INK, italic: true });
      const gx = M, gy = 2.0, cw = 2.42, ch = 2.42, gap = 0.16, cols = 3;
      s.images.slice(0, 6).forEach((im, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        if (data(im.src)) {
          slide.addImage({
            data: data(im.src),
            x: gx + c * (cw + gap), y: gy + r * (ch + gap), w: cw, h: ch,
            sizing: { type: "cover", w: cw, h: ch },
          });
        }
      });
      const sx = gx + cols * (cw + gap) + 0.35;
      const sw = W - sx - M;
      eyebrow(slide, "Palette", sx, 2.0);
      swatchRow(pptx, slide, s.palette, sx, 2.4, 0.34, 0.46);
      s.palette.forEach((sw2, i) => {
        slide.addText(sw2.name, { x: sx + 0.02, y: 2.85 + i * 0.34, w: sw, h: 0.3, fontFace: SANS, fontSize: 9.5, color: SOFT });
      });
      const my = 2.85 + s.palette.length * 0.34 + 0.35;
      eyebrow(slide, "Materials", sx, my);
      const matRuns = s.materials.flatMap((mm) => [
        { text: `${mm.name}  `, options: { bold: true, color: INK, fontSize: 10 } },
        { text: `${mm.note}\n`, options: { color: SOFT, fontSize: 10 } },
      ]);
      slide.addText(matRuns, { x: sx, y: my + 0.32, w: sw, h: 2.2, fontFace: SANS, lineSpacingMultiple: 1.2, valign: "top" });
      brandMark(slide, { y: 0.66 });
      continue;
    }

    if (s.kind === "space") {
      const heroW = 7.55;
      if (data(s.hero.src)) {
        slide.addImage({ data: data(s.hero.src), x: 0, y: 0, w: heroW, h: H, sizing: { type: "cover", w: heroW, h: H } });
      }
      const cx = heroW + 0.45;
      const cw = W - cx - M;
      eyebrow(slide, `Look & Feel  /${s.index}`, cx, 0.7, "C9A24B");
      slide.addText(s.name, { x: cx, y: 1.05, w: cw, h: 1.0, fontFace: SERIF, fontSize: 27, color: INK, italic: true, valign: "top" });
      if (s.qualifier) {
        slide.addText(s.qualifier, { x: cx, y: 1.95, w: cw, h: 0.3, fontFace: SANS, fontSize: 10.5, color: MUTED, charSpacing: 1 });
      }
      swatchRow(pptx, slide, s.palette, cx, 2.42, 0.3, 0.44);
      slide.addText(s.description, {
        x: cx, y: 2.95, w: cw, h: 2.4, fontFace: SANS, fontSize: 11.5, color: SOFT, lineSpacingMultiple: 1.3, valign: "top",
      });
      const tw = (cw - 0.24) / 3;
      s.supporting.slice(0, 3).forEach((im, i) => {
        if (data(im.src)) {
          slide.addImage({
            data: data(im.src),
            x: cx + i * (tw + 0.12), y: H - 1.5, w: tw, h: 1.05,
            sizing: { type: "cover", w: tw, h: 1.05 },
          });
        }
      });
      brandMark(slide, { y: 0.66 });
      continue;
    }

    if (s.kind === "closing") {
      slide.background = { color: INK };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: overlayColor, transparency: 88 } });
      eyebrow(slide, s.firm, M, 1.2, "C9A24B");
      slide.addText("Let's build it.", {
        x: M, y: 2.0, w: 10, h: 1.2, fontFace: SERIF, fontSize: 44, color: "FFFFFF", italic: true,
      });
      slide.addText(s.message, {
        x: M, y: 3.5, w: 8.6, h: 1.6, fontFace: SANS, fontSize: 13.5, color: "EDE4D5", lineSpacingMultiple: 1.35,
      });
      slide.addShape(pptx.ShapeType.line, { x: M, y: 5.6, w: 3, h: 0, line: { color: "C9A24B", width: 1.5 } });
      slide.addText(s.contact, { x: M, y: 5.8, w: 10, h: 0.4, fontFace: SANS, fontSize: 12, color: "F3ECE1", charSpacing: 1 });
      brandMark(slide, { y: 0.6, dark: true, h: 0.34 });
      continue;
    }
  }

  onProgress?.("Saving file", 0.95);
  const fileName = `${deck.meta.project.replace(/[^\w\s-]/g, "").trim() || "look-and-feel"} — Look & Feel.pptx`;
  await pptx.writeFile({ fileName });
  onProgress?.("Done", 1);
}
