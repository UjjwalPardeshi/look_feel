# Look & Feel Generator

**Automated, presentation-ready look & feel decks for design-and-build firms — in under two minutes.**

This is a working implementation of the product described in
[`PRD_Look_and_Feel_Generator.docx`](./PRD_Look_and_Feel_Generator.docx): a web tool that
turns a client brief and a list of the project's spaces into a personalised,
space-by-space look & feel deck, exportable to **PPTX** and **PDF** — structured
exactly like the reference presentation
(`Look & Feel Soumya Jain 09-06-2026.pptx`): cover → design concept → mood &
materials → space-by-space references → next steps.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**.

The app lives in [`web/`](./web).

---

## Quick start

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
cd web
npm run build && npm run start
```

Type-check only: `npm run typecheck`.

---

## What it does (mapped to the PRD)

| PRD requirement | Where it lives |
| --- | --- |
| **Home page** demonstrating the product | `src/app/page.tsx` + `src/components/landing/*` |
| Step 1 — **Input the brief** (style, brand colours, budget, industry, notes) | `src/components/wizard/BriefStep.tsx` |
| Step 2 — **Define the spaces** (checklist with quantities) | `src/components/wizard/SpacesStep.tsx` |
| Step 3 — **Generate the deck** (cover, narrative, space-by-space) | `src/lib/deck/build.ts`, `src/components/deck/*` |
| **One coherent design direction** across all spaces | `src/lib/styles.ts` + tone-aware imagery in `src/lib/imagery.ts` |
| **AI-image-ready** sourcing (pluggable) | `src/lib/imagery.ts` (curated, license-safe stand-in; swap in a generation API) |
| **Export to PPTX** | `src/lib/deck/pptx.ts` (pptxgenjs) |
| **Export to PDF** | `src/lib/deck/pdf.ts` (jsPDF) |
| **Edit loop** — regenerate / swap any image | `src/components/wizard/Wizard.tsx` |
| Live sample output | `src/app/sample/page.tsx` |

## Architecture

The whole pipeline is built around one immutable **`Deck` model** (`src/lib/types.ts`).
A pure builder turns a `Brief` into a `Deck`; three renderers consume the same model:

```
Brief ──▶ buildDeck() ──▶ Deck ──┬──▶ <DeckViewer/>   (on-screen preview)
                                 ├──▶ exportPptx()    (.pptx via pptxgenjs)
                                 └──▶ exportPdf()     (.pdf via jsPDF)
```

- **Design directions** (`styles.ts`) — each is a complete identity (palette,
  materials, lighting, design language) so a deck reads as one vision, not 15
  unrelated images (PRD §9, style consistency).
- **Copy engine** (`copy.ts`) — deterministic, reference-voiced prose per space.
- **Imagery** (`imagery.ts`) — curated interior photos tagged by visual
  temperature and biased to the chosen direction, with a palette-gradient
  fallback so the UI never shows a broken image. This layer is the seam where a
  real AI image-generation engine drops in (PRD §4.1).

## Notes

- v1 is intentionally scoped per the PRD: **no CAD/floor-plan parsing, no 3D**,
  no accounts/billing. Spaces are chosen from a checklist.
- Everything runs client-side; no backend or API keys required to try it.
- Imagery uses licensed/free interior photography as a stand-in for the
  generation engine — no scraping, matching the PRD's copyright-safe approach.
