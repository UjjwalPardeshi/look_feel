# Look & Feel Generator

**Automated, presentation-ready look & feel decks for design-and-build firms — in under two minutes.**

A working implementation of the product described in the PRD
([`reference/PRD_Look_and_Feel_Generator.docx`](./reference/PRD_Look_and_Feel_Generator.docx)):
a web tool that turns a client brief and a list of the project's spaces into a
personalised, space-by-space look & feel deck, exportable to **PPTX** and
**PDF** — structured exactly like the reference presentation
(`reference/Look & Feel Soumya Jain 09-06-2026.pptx`): cover → design concept →
mood & materials → space-by-space references → next steps.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**. The Next app
lives at the repository root, so it deploys to **Vercel with zero configuration**
(auto-detected framework, no Root Directory setting required).

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build && npm run start
```

Type-check only: `npm run typecheck`.

## Deploy to Vercel

Import the repo in Vercel and deploy — nothing else to configure:

- **Framework preset:** Next.js (auto-detected)
- **Root Directory:** `./` (repo root — leave as default)
- **Build command / Output:** defaults (`next build` → `.next`)

The reference decks under `reference/` are excluded from deployments via
[`.vercelignore`](./.vercelignore).

> If you previously set the project's **Root Directory** to `web` in the Vercel
> dashboard, reset it to `./` (repo root) — the app now lives at the root.

### Enable the shared Reference Library (one-time)

The library stores every generated/uploaded reference in **Vercel Blob** so the
whole team reuses imagery across clients instead of regenerating it:

1. Vercel dashboard → your project → **Storage → Create Database → Blob**, and
   connect it to the project (Production + Preview).
2. Add a **`BLOB_READ_WRITE_TOKEN`** environment variable holding the store's
   read-write token. (Connecting a store only provisions `BLOB_STORE_ID` /
   `BLOB_WEBHOOK_PUBLIC_KEY`, so this one is added by hand.)
3. Redeploy.

Stores are **private**, so references are never world-readable: assets are
streamed back through an authenticated route (`/api/library/file`) and, because
pathnames are content-addressed, cached immutably at the edge — only the first
request per image touches the function.

Without the store the app still works fully (decks generate from the built-in
pool); the `/library` page shows these setup steps until it's connected. For
local dev, run `vercel env pull` to get the token into `.env.local`.

**Optional:** set a `LIBRARY_ADMIN_TOKEN` env var to protect deletions — the
library page will ask for the token the first time someone removes an image.
Reads and ingestion stay open (v1 is an internal tool; full accounts are a v2
item per the PRD).

---

## The Reference Library (cost-saving mechanic)

Generating fresh AI imagery for every deck costs money on every run. The
library flips that: **generate once, reuse forever.**

- Every space reference used in a generated deck is auto-saved to Vercel Blob,
  organised into real folders by space —
  `library/reception/…`, `library/private-cabin/…` — plus design direction.
- Content is **deduped** (same photo at different sizes stores once), so
  re-generating decks is effectively free.
- New decks **pull from the library first** and only fall back to the
  generator for what's missing; picks rotate per client so decks stay varied.
- Designer uploads from the swap flow are banked into the library too.
- Browse, filter, and prune everything at **`/library`**.

When a real AI image-generation engine replaces the built-in pool, its output
flows through this exact pipeline — the library then directly amortises
per-image generation spend.

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
| **Edit loop** — regenerate / swap any image | `src/components/wizard/Wizard.tsx` + `SwapModal.tsx` |
| **Shared reference library** (reuse across clients) | `src/lib/library/*`, `src/app/api/library/*`, `src/app/library/page.tsx` |
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
  unrelated images.
- **Copy engine** (`copy.ts`) — deterministic, reference-voiced prose per space.
- **Imagery** (`imagery.ts`) — curated interior photos tagged by visual
  temperature and biased to the chosen direction, with a palette-gradient
  fallback so the UI never shows a broken image. This layer is the seam where a
  real AI image-generation engine drops in.

Everything runs client-side; no backend or API keys required to try it.
Image export uses direct `<img>` fetches (not `next/image`) so a deck of
10–15 references never hits Vercel's image-optimizer quota.
